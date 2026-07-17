from __future__ import annotations

# src/jobs/sync_company_info_job.py
#
# 실행: python -m src.jobs.sync_company_info_job
# 용도: indutyCode 없는 기업에 DART 상세정보 보완 (1회 1000개씩, 매일 자동 실행)
#

import time

from src.clients.dart_client import REQUEST_DELAY, DartClient
from src.database.connection import get_session
from src.repositories.company_repository import CompanyRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)


def run(limit: int = 1000) -> None:
    dart = DartClient()
    try:
        with get_session() as session:
            repo = CompanyRepository(session)
            corp_codes = repo.find_without_induty(limit=limit)

            if not corp_codes:
                logger.info("indutyCode 없는 기업 없음 — 완료")
                return

            logger.info(f"=== 기업 상세정보 보완 시작: {len(corp_codes)}개 ===")
            updated = 0

            for corp_code in corp_codes:
                info = dart.fetch_company_info(corp_code)
                if info and info.induty_code:
                    repo.update_company_info(corp_code, {
                        "indutyCode": info.induty_code,
                        "indutyName": None,
                        "ceoName":    info.ceo_nm,
                        "market":     _corp_cls_to_market(info.corp_cls),
                    })
                    updated += 1
                time.sleep(REQUEST_DELAY)

            session.commit()
            logger.info(f"기업 상세정보 보완 완료: {updated}/{len(corp_codes)}개")
    finally:
        dart.close()


def _corp_cls_to_market(corp_cls: str) -> str | None:
    return {"Y": "KOSPI", "K": "KOSDAQ", "N": "KONEX"}.get(corp_cls)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=1000)
    args = parser.parse_args()
    run(limit=args.limit)
