from __future__ import annotations

# src/services/financial_sync_service.py
import time

from sqlalchemy.orm import Session

from src.clients.dart_client import DartClient, FinancialItem
from src.config.settings import get_settings
from src.repositories.company_repository import CompanyRepository
from src.repositories.financial_repository import FinancialRepository
from src.utils.date import default_financial_years
from src.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

# DART 계정과목 → 필드명 매핑
ACCOUNT_MAP: dict[str, str] = {
    "매출액":          "revenue",
    "수익(매출액)":    "revenue",
    "영업수익":        "revenue",
    "영업이익":        "operating_profit",
    "영업이익(손실)":  "operating_profit",
    "당기순이익":      "net_income",
    "당기순이익(손실)":"net_income",
    "자산총계":        "total_assets",
    "부채총계":        "total_liability",
    "자본총계":        "total_equity",
}


def _parse_amount(s: str) -> int | None:
    cleaned = s.replace(",", "").strip()
    if not cleaned or cleaned == "-":
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def _parse_items(items: list[FinancialItem]) -> dict:
    result: dict[str, int | None] = {}
    for item in items:
        field = ACCOUNT_MAP.get(item.account_nm)
        if field and field not in result:
            result[field] = _parse_amount(item.thstrm_amount)
    return result


def _calc_metrics(current: dict, prev: dict | None) -> dict:
    def safe_div(a, b):
        return (a / b) if a is not None and b and b != 0 else None

    rev      = current.get("revenue")
    op       = current.get("operating_profit")
    ni       = current.get("net_income")
    assets   = current.get("total_assets")
    liab     = current.get("total_liability")
    equity   = current.get("total_equity")
    prev_rev = prev.get("revenue") if prev else None

    return {
        "revenue_growth_rate": safe_div(rev - prev_rev, prev_rev) * 100
                               if rev is not None and prev_rev else None,
        "operating_margin":    safe_div(op, rev) * 100 if op is not None else None,
        "debt_ratio":          safe_div(liab, equity) * 100 if liab is not None else None,
        "roe":                 safe_div(ni, equity) * 100 if ni is not None else None,
        "roa":                 safe_div(ni, assets) * 100 if ni is not None else None,
    }


class FinancialSyncService:
    def __init__(
        self,
        session: Session,
        dart_client: DartClient,
    ) -> None:
        self._session = session
        self._company_repo = CompanyRepository(session)
        self._financial_repo = FinancialRepository(session)
        self._dart = dart_client

    def sync_one(self, corp_code: str, years: list[int] | None = None) -> dict:
        """
        단일 기업 재무제표 동기화
        반환: {"corp_code": ..., "synced": N, "skipped": N}
        """
        company = self._company_repo.find_by_corp_code(corp_code)
        if not company:
            logger.warning(f"[{corp_code}] DB에 없는 기업")
            return {"corp_code": corp_code, "synced": 0, "skipped": 0}

        target_years = years or default_financial_years()
        synced, skipped = 0, 0

        for year in target_years:
            # 연결재무제표 우선, 없으면 별도
            items, report_type = [], "CFS"
            for fs_div in ("CFS", "OFS"):
                items = self._dart.fetch_financial_statement(corp_code, year, fs_div)  # type: ignore[arg-type]
                if items:
                    report_type = fs_div
                    break

            if not items:
                skipped += 1
                logger.debug(f"[{corp_code}/{year}] 데이터 없음")
                time.sleep(settings.dart_request_delay)
                continue

            current = _parse_items(items)

            # 전년도 데이터 (성장률 계산용)
            prev_record = self._financial_repo.find_by_year(company.id, year - 1, report_type)
            prev = None
            if prev_record:
                prev = {"revenue": prev_record.revenue}

            metrics = _calc_metrics(current, prev)

            self._financial_repo.upsert({
                "company_id":  company.id,
                "year":        year,
                "quarter":     None,
                "report_type": report_type,
                **current,
                **metrics,
            })

            synced += 1
            time.sleep(settings.dart_request_delay)

        self._session.commit()
        return {"corp_code": corp_code, "synced": synced, "skipped": skipped}

    def sync_many(self, corp_codes: list[str], years: list[int] | None = None) -> list[dict]:
        results = []
        for i, code in enumerate(corp_codes, 1):
            logger.info(f"[{i}/{len(corp_codes)}] 재무제표 동기화: {code}")
            result = self.sync_one(code, years)
            results.append(result)
        return results
