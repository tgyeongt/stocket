from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.config.settings import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine,
)