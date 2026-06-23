"""Database engine and session factory."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_db_url = os.environ["DATABASE_URL"].replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    _db_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"prepare_threshold": 0},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_session():
    """Yield a database session, ensuring it's closed afterward."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
