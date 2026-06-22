"""One-shot loader: read recipes.jsonl and populate the database.

Assumes the schema already exists (created by Alembic).
Safe to run repeatedly — skips recipes whose title already exists.
"""

import json
import os
from pathlib import Path

from db.session import SessionLocal
from db.models import Recipe, Ingredient, Step, Tag, Appliance


_default_data = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(_default_data)))
JSONL_PATH = DATA_DIR / "recipes.jsonl"


def load() -> None:
    session = SessionLocal()

    tag_cache: dict[str, Tag] = {}
    for t in session.query(Tag).all():
        tag_cache[t.name] = t

    appliance_cache: dict[str, Appliance] = {}
    for a in session.query(Appliance).all():
        appliance_cache[a.name] = a

    existing_titles = {row[0] for row in session.query(Recipe.title).all()}

    def get_or_create_tag(name: str) -> Tag:
        if name not in tag_cache:
            tag = Tag(name=name)
            session.add(tag)
            tag_cache[name] = tag
        return tag_cache[name]

    def get_or_create_appliance(name: str) -> Appliance:
        if name not in appliance_cache:
            app = Appliance(name=name)
            session.add(app)
            appliance_cache[name] = app
        return appliance_cache[name]

    inserted, skipped = 0, 0
    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)

            if data["title"] in existing_titles:
                skipped += 1
                continue

            total_cost = round(sum(i["est_price_gbp"] for i in data["ingredients"]), 2)
            cost_per_serving = round(total_cost / data["servings"], 2)

            recipe = Recipe(
                title=data["title"],
                cuisine=data["cuisine"],
                servings=data["servings"],
                calories_per_serving=data["calories_per_serving"],
                prep_minutes=data["prep_minutes"],
                total_cost_gbp=total_cost,
                cost_per_serving_gbp=cost_per_serving,
            )

            recipe.ingredients = [
                Ingredient(name=i["name"], grams=i["grams"], est_price_gbp=i["est_price_gbp"])
                for i in data["ingredients"]
            ]
            recipe.steps = [
                Step(position=idx + 1, content=text)
                for idx, text in enumerate(data["steps"])
            ]
            recipe.tags = [get_or_create_tag(t) for t in data["tags"]]
            recipe.appliances = [get_or_create_appliance(a) for a in data["appliances_required"]]

            session.add(recipe)
            existing_titles.add(data["title"])
            inserted += 1

    session.commit()
    session.close()
    print(f"Loaded {inserted} recipes ({skipped} skipped)")


if __name__ == "__main__":
    load()
