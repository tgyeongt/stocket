# src/main.py
#
# 실행: python -m src.main
# 역할: 스케줄러 상시 실행 (평일 주가 + 주간 재무제표)
#

import schedule
import time

from src.jobs import sync_companies_job, sync_financials_job, sync_stocks_job
from src.utils.logger import get_logger

logger = get_logger(__name__)


def main() -> None:
    logger.info("StockLens Data Scheduler 시작")

    # 평일 오전 7시: 주가 + 지표 갱신
    schedule.every().monday.at("07:00").do(sync_stocks_job.run)
    schedule.every().tuesday.at("07:00").do(sync_stocks_job.run)
    schedule.every().wednesday.at("07:00").do(sync_stocks_job.run)
    schedule.every().thursday.at("07:00").do(sync_stocks_job.run)
    schedule.every().friday.at("07:00").do(sync_stocks_job.run)

    # 일요일 새벽 2시: 재무제표 갱신
    schedule.every().sunday.at("02:00").do(sync_financials_job.run)

    logger.info("스케줄 등록 완료. 대기 중...")

    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    main()
