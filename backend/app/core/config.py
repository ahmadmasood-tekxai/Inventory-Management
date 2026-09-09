"""
Central application configuration.
All environment-driven values live here — nowhere else in the codebase
should call os.environ / os.getenv directly. This keeps config changes
one file wide and makes the app trivially testable via env overrides.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ---- App ----
    APP_NAME: str = "Qasim Inventory API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ---- Database ----
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/qasim_inventory"
    TEST_DATABASE_URL: str = "sqlite:///./test_qasim_inventory.db"

    # ---- Security ----
    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- CORS ----
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — avoids re-parsing .env on every import."""
    return Settings()


settings = get_settings()
