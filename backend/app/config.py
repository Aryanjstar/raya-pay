from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV, extra="ignore")

    database_url: str = "postgresql+psycopg://raya:raya@localhost:5432/raya"
    cors_origins: str = "http://localhost:3000"
    coin_cap_per_txn: int = 50

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
