# src/jobs/sync_stocks_job.py
#
# 실행: python -m src.jobs.sync_stocks_job
# 실행: python -m src.jobs.sync_stocks_job --corp-codes 00126380 --days 30
# 용도: 매일 장 마감 후 주가 + 지표 수집 (Cron)
#

from src.clients.kis_client import KisClient
from src.database.connection import get_session
from src.repositories.company_repository import CompanyRepository
from src.services.metrics_service import MetricsService
from src.services.stock_sync_service import StockSyncService
from src.utils.logger import get_logger

logger = get_logger(__name__)


def run(corp_codes: list[str] | None = None, days: int = 120) -> None:
    kis_client = KisClient()

    try:
        with get_session() as session:
            if not corp_codes:
                corp_codes = CompanyRepository(session).find_all_corp_codes(listed_only=True)

            logger.info(f"=== 주가 동기화 시작: {len(corp_codes)}개 기업 ===")

            # 1단계: 주가 저장
            stock_service = StockSyncService(session, kis_client)
            results = stock_service.sync_many(corp_codes, days)

            saved_total = sum(r["saved"] for r in results)
            logger.info(f"주가 저장 완료: {saved_total}건")

            # 2단계: 지표 계산
            logger.info("=== 파생 지표 계산 시작 ===")
            metrics_service = MetricsService(session)
            metrics_result = metrics_service.calc_many(corp_codes)
            logger.info(f"지표 계산 완료: {metrics_result}")
    finally:
        kis_client.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--corp-codes", nargs="+")
    parser.add_argument("--days", type=int, default=120)
    args = parser.parse_args()

    run(corp_codes=args.corp_codes, days=args.days)
