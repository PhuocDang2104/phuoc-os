from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    cors_origins: list[str] = ["http://localhost:3000"]
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "portfolio"
    postgres_user: str = "portfolio"
    postgres_password: SecretStr = SecretStr("")
    groq_api_key: SecretStr = SecretStr("")
    groq_model: str = "llama-3.3-70b-versatile"

    @model_validator(mode="after")
    def validate_production(self):
        if self.app_env == "production":
            if not self.postgres_password.get_secret_value():
                raise ValueError("A database password is required in production")
            if not self.cors_origins or any(
                not origin.startswith("https://") or "*" in origin
                for origin in self.cors_origins
            ):
                raise ValueError("Production CORS origins must be explicit HTTPS origins")
        return self

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value(),
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
