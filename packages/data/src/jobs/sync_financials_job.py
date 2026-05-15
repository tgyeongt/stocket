from __future__ import annotations

# src/jobs/sync_financials_job.py
#
# 실행: python -m src.jobs.sync_financials_job
# 실행: python -m src.jobs.sync_financials_job --corp-codes 00126380
# 용도: 재무제표 수집 (매주 일요일 새벽)
#

from src.clients.dart_client import DartClient
from src.database.connection import get_session
from src.repositories.company_repository import CompanyRepository
from src.services.financial_sync_service import FinancialSyncService
from src.utils.logger import get_logger

logger = get_logger(__name__)


def run(corp_codes: list[str] | None = None) -> None:
    dart_client = DartClient()
    try:
        with get_session() as session:
            if not corp_codes:
                corp_codes = CompanyRepository(session).find_all_corp_codes(listed_only=True)

            logger.info(f"=== 재무제표 동기화 시작: {len(corp_codes)}개 기업 ===")
            service = FinancialSyncService(session, dart_client)
            results = service.sync_many(corp_codes)

            synced_total = sum(r["synced"] for r in results)
            logger.info(f"재무제표 동기화 완료: {synced_total}건")
    finally:
        dart_client.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--corp-codes", nargs="+")
    args = parser.parse_args()

    run(corp_codes=args.corp_codes)
