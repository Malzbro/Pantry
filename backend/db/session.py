"""Database engine and session factory."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    os.environ["DATABASE_URL"],
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
