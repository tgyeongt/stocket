import asyncio

from src.database.connection import SessionLocal
from src.services.company_sync_service import CompanySyncService


async def main():
    db = SessionLocal()

    try:
        service = CompanySyncService(db)

        await service.sync()

        print("기업 목록 동기화 완료")

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())