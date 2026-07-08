from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

ENV_FILE = Path(__file__).resolve().parents[4] / ".env"


class Settings(BaseSettings):
    database_url: str

    dart_api_key: str
    dart_request_delay: float = 0.5

    kis_base_url: str = "https://openapi.koreainvestment.com:9443"
    kis_app_key: str
    kis_app_secret: str

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = False
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
