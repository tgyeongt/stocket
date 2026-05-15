from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    DART_API_KEY: str

    KIS_APP_KEY: str
    KIS_APP_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()