from __future__ import annotations

"""
주요 5개 기업 데이터를 DB에 저장하는 시드 스크립트
실행: python -m src.api.seed
"""
import time
from datetime import date, timedelta

from src.clients.dart_client import DartClient
from src.clients.kis_client import KisClient
from src.database.connection import get_session
from src.repositories.company_repository import CompanyRepository
from src.repositories.financial_repository import FinancialRepository
from src.repositories.stock_repository import StockRepository
from src.services.financial_sync_service import (
    FinancialSyncService,
    _parse_items,
    _calc_metrics,
)
from src.services.metrics_service import MetricsService
from src.utils.logger import get_logger

logger = get_logger(__name__)

# 주요 5개 기업 주식코드 (더 안정적; corp_code는 DART 목록에서 조회)
MAIN_STOCK_CODES = [
    "005930",  # 삼성전자
    "000660",  # SK하이닉스
    "035420",  # NAVER
    "035720",  # 카카오
    "373220",  # LG에너지솔루션
]


def _build_corp_maps(dart: DartClient) -> tuple[dict[str, str], dict[str, str]]:
    """주식코드 → corp_code 맵, corp_code → corp_name 맵 반환"""
    corp_list = dart.fetch_corp_code_list()
    stock_to_corp = {row["stock_code"]: row["corp_code"] for row in corp_list}
    corp_to_name = {row["corp_code"]: row["corp_name"] for row in corp_list}
    return stock_to_corp, corp_to_name


def seed():
    dart = DartClient()
    kis = KisClient()

    try:
        logger.info("DART 기업 목록 다운로드 중...")
        stock_to_corp, corp_to_name = _build_corp_maps(dart)

        corp_codes: list[str] = []
        for sc in MAIN_STOCK_CODES:
            cc = stock_to_corp.get(sc)
            if cc:
                corp_codes.append(cc)
                logger.info(f"[{sc}] corp_code: {cc}")
            else:
                logger.warning(f"[{sc}] DART 목록에서 corp_code 없음, 스킵")

        with get_session() as session:
            company_repo = CompanyRepository(session)
            financial_repo = FinancialRepository(session)
            stock_repo = StockRepository(session)

            for corp_code in corp_codes:
                logger.info(f"=== {corp_code} 시드 시작 ===")

                # 1. 기업 기본 정보
                info = dart.fetch_company_info(corp_code)
                if not info:
                    logger.warning(f"[{corp_code}] 기업 정보 없음, 스킵")
                    continue

                market_map = {"Y": "코스피", "K": "코스닥", "N": "코넥스"}
                # DART corp list name (e.g. "SK하이닉스") is cleaner than the official API name
                # ("에스케이하이닉스(주)") and matches what users search for.
                display_name = corp_to_name.get(corp_code, info.corp_name)
                company_repo.upsert({
                    "corp_code": info.corp_code,
                    "corp_name": display_name,
                    "stock_code": info.stock_code,
                    "induty_code": info.induty_code,
                    "induty_name": None,
                    "sector": None,
                    "market": market_map.get(info.corp_cls),
                    "ceo_name": info.ceo_nm,
                })
                session.flush()
                time.sleep(0.3)

                company = company_repo.find_by_corp_code(corp_code)
                if not company:
                    continue

                # 2. 재무제표 (전년도 + 전전년도 성장률용)
                current_year = date.today().year - 1
                for year in [current_year - 1, current_year]:
                    items, report_type = [], "CFS"
                    for fs_div in ("CFS", "OFS"):
                        items = dart.fetch_financial_statement(corp_code, year, fs_div)  # type: ignore
                        if items:
                            report_type = fs_div
                            break

                    if not items:
                        logger.debug(f"[{corp_code}/{year}] 재무 없음")
                        time.sleep(0.5)
                        continue

                    curr = _parse_items(items)
                    prev_rec = financial_repo.find_by_year(company.id, year - 1, report_type)
                    prev = {"revenue": prev_rec.revenue} if prev_rec else None
                    metrics = _calc_metrics(curr, prev)

                    financial_repo.upsert({
                        "company_id": company.id,
                        "year": year,
                        "quarter": None,
                        "report_type": report_type,
                        **curr,
                        **metrics,
                    })
                    logger.info(f"[{corp_code}/{year}] 재무 저장 완료")
                    time.sleep(0.5)

                # 3. 주가 (최근 180일)
                if company.stockCode:
                    end_dt = date.today()
                    start_dt = end_dt - timedelta(days=180)
                    prices = kis.fetch_daily_prices(
                        company.stockCode,
                        start_dt.strftime("%Y%m%d"),
                        end_dt.strftime("%Y%m%d"),
                    )
                    for p in prices:
                        price_date = date(int(p.date[:4]), int(p.date[4:6]), int(p.date[6:]))
                        stock_repo.upsert_price({
                            "company_id": company.id,
                            "date": price_date,
                            "open": p.open,
                            "high": p.high,
                            "low": p.low,
                            "close": p.close,
                            "volume": p.volume,
                            "change_rate": p.change_rate,
                        })
                    logger.info(f"[{corp_code}] 주가 {len(prices)}건 저장")
                    time.sleep(0.2)

                session.commit()

                # 4. 파생 지표 계산
                MetricsService(session).calc_one(corp_code)
                logger.info(f"[{corp_code}] 지표 계산 완료")

            logger.info("=== 시드 완료 ===")

    finally:
        dart.close()
        kis.close()


if __name__ == "__main__":
    seed()
