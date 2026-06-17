from __future__ import annotations

# src/jobs/cleanup_cold_data_job.py
#
# 실행: python -m src.jobs.cleanup_cold_data_job
# 용도: 30일간 미조회된 Cold 기업의 stock_prices, stock_metrics 삭제

from src.database.connection import get_session
from src.database.models import StockMetrics, StockPrice
from src.repositories.company_repository import CompanyRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)


def run(days: int = 30) -> None:
    with get_session() as session:
        repo = CompanyRepository(session)
        cold_ids = repo.find_cold_company_ids(days)

        if not cold_ids:
            logger.info("정리할 Cold 데이터 없음")
            return

        deleted_prices = (
            session.query(StockPrice)
            .filter(StockPrice.companyId.in_(cold_ids))
            .delete(synchronize_session=False)
        )
        deleted_metrics = (
            session.query(StockMetrics)
            .filter(StockMetrics.companyId.in_(cold_ids))
            .delete(synchronize_session=False)
        )

        session.commit()
        logger.info(
            f"Cold 데이터 정리: {len(cold_ids)}개 기업, "
            f"주가 {deleted_prices}건, 지표 {deleted_metrics}건 삭제"
        )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=30)
    args = parser.parse_args()

    run(days=args.days)
