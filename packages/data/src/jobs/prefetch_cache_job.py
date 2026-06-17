from __future__ import annotations

# src/jobs/prefetch_cache_job.py
#
# 실행: python -m src.jobs.prefetch_cache_job
# 용도: Hot 기업의 /company 응답을 Redis에 사전 캐싱 (스케줄러 연동)
# 전제: FastAPI 서버가 실행 중이어야 함

import time

import httpx

from src.database.connection import get_session
from src.database.models import Company
from src.repositories.company_repository import CompanyRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)

DATA_SERVICE_URL = "http://localhost:8000"


def run(service_url: str = DATA_SERVICE_URL) -> None:
    with get_session() as session:
        repo = CompanyRepository(session)
        hot_codes = repo.find_hot_corp_codes()
        if not hot_codes:
            logger.info("프리페치할 Hot 기업 없음")
            return

        companies = (
            session.query(Company.corpName)
            .filter(Company.corpCode.in_(hot_codes))
            .all()
        )

    logger.info(f"=== Hot 기업 캐시 프리페치 시작: {len(companies)}개 ===")
    success = 0

    with httpx.Client(base_url=service_url, timeout=60) as client:
        for (corp_name,) in companies:
            try:
                resp = client.get("/company", params={"name": corp_name})
                if resp.status_code == 200:
                    success += 1
                    logger.info(f"프리페치 완료: {corp_name}")
                else:
                    logger.warning(f"프리페치 실패 [{corp_name}]: HTTP {resp.status_code}")
            except Exception as e:
                logger.warning(f"프리페치 오류 [{corp_name}]: {e}")
            time.sleep(1)

    logger.info(f"=== 프리페치 완료: {success}/{len(companies)} ===")


if __name__ == "__main__":
    run()
