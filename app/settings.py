from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    storage_directory: str = "storage"
    csv_chunk_size: int = 10_000
    csv_max_chart_points: int = 5_000
    csv_max_exact_median_values: int = 100_000
    csv_max_median_sample_size: int = 50_000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def resolve_storage_directory(self) -> Path:
        return Path(self.storage_directory)


@lru_cache
def get_settings() -> Settings:
    return Settings()
