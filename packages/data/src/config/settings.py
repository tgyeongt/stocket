from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str

    dart_api_key: str
    dart_request_delay: float = 0.5

    kis_base_url: str = "https://openapi.koreainvestment.com:9443"
    kis_app_key: str
    kis_app_secret: str

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
