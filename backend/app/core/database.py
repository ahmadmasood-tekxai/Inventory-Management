"""
Database engine + session management.

Design notes for scalability:
- `pool_pre_ping` avoids stale-connection errors after DB restarts / idle timeouts.
- Pool size is tuned for a small-to-mid VPS; bump via env if traffic grows.
- SQLite (used only in tests) needs `check_same_thread=False` and no pool args.
"""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


def _build_engine(url: str):
    connect_args = {}
    engine_kwargs = {"pool_pre_ping": True}

    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        engine_kwargs.update(pool_size=10, max_overflow=20, pool_recycle=1800)

    return create_engine(url, connect_args=connect_args, **engine_kwargs)


engine = _build_engine(settings.effective_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db() -> Generator:
    """FastAPI dependency — yields a request-scoped DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
