"""
Central application configuration.
All environment-driven values live here — nowhere else in the codebase
should call os.environ / os.getenv directly. This keeps config changes
one file wide and makes the app trivially testable via env overrides.
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_database_url() -> str:
    """Resolve the SQLite DB path.

    When running inside the packaged Electron app, Electron sets the
    QASIM_DATA_DIR environment variable to the OS per-user data folder
    (e.g. C:\\Users\\<user>\\AppData\\Roaming\\Qasim Inventory\\).
    This keeps the database file safe across app updates and uninstalls.

    In development (no env var) we fall back to a local file so that
    `uvicorn app.main:app` still works without any extra setup.
    """
    data_dir = os.environ.get("QASIM_DATA_DIR")
    if data_dir:
        Path(data_dir).mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{Path(data_dir) / 'qasim_inventory.db'}"
    return "sqlite:///./qasim_inventory.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ---- App ----
    APP_NAME: str = "Qasim Inventory API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ---- Database ----
    # Defaults to SQLite (configurable via DATABASE_URL env var).
    # Electron sets QASIM_DATA_DIR so the DB lives in the userData folder.
    DATABASE_URL: str = ""
    TEST_DATABASE_URL: str = "sqlite:///./test_qasim_inventory.db"

    # ---- Security ----
    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- CORS ----
    # "*" allows Electron's file:// origin. In a web-only deploy, restrict this.
    CORS_ORIGINS: str = "*"

    @property
    def effective_database_url(self) -> str:
        """Return DATABASE_URL if explicitly set, otherwise derive from QASIM_DATA_DIR."""
        return self.DATABASE_URL if self.DATABASE_URL else _default_database_url()

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — avoids re-parsing .env on every import."""
    return Settings()


settings = get_settings()
