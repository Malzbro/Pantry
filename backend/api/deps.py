"""FastAPI dependency providers.

Endpoints declare these as parameters and FastAPI handles lifecycle
(opening, closing, error rollback) automatically.
"""

from collections.abc import Generator
from uuid import UUID

from sqlalchemy.orm import Session

from db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session that's closed after the request completes."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# TODO(Handoff 05 — Auth): replace with JWT-decoding dependency
TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


def current_user_id() -> UUID:
    return TEST_USER_ID