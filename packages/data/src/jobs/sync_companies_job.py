# src/jobs/sync_companies_job.py
#
# 실행: python -m src.jobs.sync_companies_job
# 용도: DART 기업 목록 최초/정기 수집
#

from src.database.connection import get_session
from src.services.company_sync_service import CompanySyncService
from src.utils.logger import get_logger

logger = get_logger(__name__)


def run() -> None:
    with get_session() as session:
        service = CompanySyncService(session)
        try:
            result = service.sync()
            logger.info(f"기업 목록 동기화 완료: {result}")
        finally:
            service.close()


if __name__ == "__main__":
    run()
