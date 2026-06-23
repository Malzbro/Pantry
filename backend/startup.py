"""Production startup: wait for Postgres, run migrations, seed data, then serve.

Idempotent — safe across container restarts.
"""

import os
import subprocess
import sys
import time
from pathlib import Path
from uuid import UUID

from sqlalchemy import create_engine, text


DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

CHROMA = DATA_DIR / "chroma"
JSONL = DATA_DIR / "recipes.jsonl"


def run(cmd: list[str], description: str) -> None:
    print(f"\n[startup] {description}")
    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    if result.returncode != 0:
        print(f"[startup] FAILED: {description}", file=sys.stderr)
        sys.exit(result.returncode)


def wait_for_postgres(url: str, timeout: int = 30) -> None:
    engine = create_engine(url)
    deadline = time.time() + timeout
    while True:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("[startup] Postgres is reachable")
            engine.dispose()
            return
        except Exception as e:
            if time.time() > deadline:
                print(f"[startup] Postgres not reachable after {timeout}s: {e}", file=sys.stderr)
                sys.exit(1)
            print(f"[startup] Waiting for Postgres... ({e.__class__.__name__})")
            time.sleep(2)


def recipes_table_empty(url: str) -> bool:
    engine = create_engine(url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM recipes"))
        count = result.scalar()
    engine.dispose()
    return count == 0


TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")
TEST_HOUSEHOLD_ID = UUID("00000000-0000-0000-0000-000000000010")


def seed_dev_user(url: str) -> None:
    """Insert the stub test user and default household if they don't exist."""
    engine = create_engine(url)
    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM profiles WHERE id = :id"),
            {"id": str(TEST_USER_ID)},
        ).scalar()
        if exists:
            print("[startup] Test user already seeded")
            engine.dispose()
            return

        conn.execute(
            text("INSERT INTO profiles (id, display_name) VALUES (:id, :name)"),
            {"id": str(TEST_USER_ID), "name": "Dev User"},
        )
        conn.execute(
            text(
                "INSERT INTO households (id, name, household_size, created_by_user_id) "
                "VALUES (:id, :name, :size, :user_id)"
            ),
            {"id": str(TEST_HOUSEHOLD_ID), "name": "Home", "size": 2, "user_id": str(TEST_USER_ID)},
        )
        conn.execute(
            text(
                "INSERT INTO household_members (household_id, user_id, role) "
                "VALUES (:hid, :uid, 'owner')"
            ),
            {"hid": str(TEST_HOUSEHOLD_ID), "uid": str(TEST_USER_ID)},
        )
        conn.commit()
        print("[startup] Seeded test user + default household")
    engine.dispose()


def main():
    db_url = os.environ["DATABASE_URL"]
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    print(f"[startup] DATA_DIR = {DATA_DIR}")

    # 1. Wait for Postgres
    wait_for_postgres(db_url)

    # 2. Run Alembic migrations
    run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        "Running Alembic migrations",
    )

    # 2b. Seed dev user and household
    seed_dev_user(db_url)

    # 3. Seed JSONL from baked-in seed if not on the volume
    SEED_JSONL = Path(__file__).parent / "seed" / "recipes.jsonl"
    if not JSONL.exists():
        if SEED_JSONL.exists():
            print(f"[startup] Seeding recipes.jsonl from baked-in seed ({SEED_JSONL.stat().st_size} bytes)...")
            import shutil
            shutil.copy(SEED_JSONL, JSONL)
        else:
            print("[startup] No recipes.jsonl found — generating dataset (this takes ~15 min)...")
            run([sys.executable, "-m", "generator.run_all"], "Generate recipes")
    else:
        print(f"[startup] Found existing recipes.jsonl ({JSONL.stat().st_size} bytes), skipping generation")

    # 4. Load data only if the recipes table is empty
    if recipes_table_empty(db_url):
        print("[startup] Recipes table is empty — loading dataset...")
        run([sys.executable, "-m", "db.load"], "Load recipe data")
    else:
        print("[startup] Recipes table already populated, skipping load")

    # 5. Build Chroma index if missing
    if not CHROMA.exists() or not any(CHROMA.iterdir()):
        print("[startup] No Chroma index found — building it (this takes ~30s)...")
        run([sys.executable, "-m", "rag.index"], "Build Chroma index")
    else:
        print("[startup] Found existing Chroma index, skipping rebuild")

    print("\n[startup] All set. Starting uvicorn...\n")
    port = os.getenv("PORT", "8000")
    os.execvp(sys.executable, [sys.executable, "-m", "uvicorn", "main:app",
                               "--host", "0.0.0.0", "--port", port])


if __name__ == "__main__":
    main()
