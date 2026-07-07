from __future__ import annotations

# src/services/financial_sync_service.py
import time

import numpy as np
import pandas as pd
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

_RATIO_COLUMNS = [
    "revenue_growth_rate",
    "operating_margin",
    "debt_ratio",
    "roe",
    "roa",
]

_RAW_COLUMNS = [
    "revenue",
    "operating_profit",
    "net_income",
    "total_assets",
    "total_liability",
    "total_equity",
]


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


def _calc_ratios_frame(df: pd.DataFrame) -> pd.DataFrame:
    """
    df는 revenue, operating_profit, net_income, total_assets,
    total_liability, total_equity, prev_revenue 컬럼을 가진다.
    각 행에 대해 revenue_growth_rate/operating_margin/debt_ratio/roe/roa를
    벡터화 연산으로 계산해 추가한다 (분모 0/None 조건은 df.loc 마스킹으로 처리).
    """
    df = df.copy()
    for col in _RATIO_COLUMNS:
        df[col] = np.nan

    # None이 섞이면 object dtype이 되어 0으로 나눌 때 numpy처럼 inf를 내는 대신
    # 파이썬 레벨에서 ZeroDivisionError가 발생한다. float64로 강제 변환해 방지.
    numeric_cols = [*_RAW_COLUMNS, "prev_revenue"]
    df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors="coerce")

    valid_growth = (
        df["revenue"].notna()
        & df["prev_revenue"].notna() & (df["prev_revenue"] != 0)
    )
    df.loc[valid_growth, "revenue_growth_rate"] = (
        (df["revenue"] - df["prev_revenue"]) / df["prev_revenue"] * 100
    )

    valid_margin = df["revenue"].notna() & (df["revenue"] != 0) & df["operating_profit"].notna()
    df.loc[valid_margin, "operating_margin"] = df["operating_profit"] / df["revenue"] * 100

    valid_debt = df["total_liability"].notna() & df["total_equity"].notna() & (df["total_equity"] != 0)
    df.loc[valid_debt, "debt_ratio"] = df["total_liability"] / df["total_equity"] * 100

    valid_roe = df["net_income"].notna() & df["total_equity"].notna() & (df["total_equity"] != 0)
    df.loc[valid_roe, "roe"] = df["net_income"] / df["total_equity"] * 100

    valid_roa = df["net_income"].notna() & df["total_assets"].notna() & (df["total_assets"] != 0)
    df.loc[valid_roa, "roa"] = df["net_income"] / df["total_assets"] * 100

    return df


def _calc_metrics(current: dict, prev: dict | None) -> dict:
    row = {
        "revenue": current.get("revenue"),
        "operating_profit": current.get("operating_profit"),
        "net_income": current.get("net_income"),
        "total_assets": current.get("total_assets"),
        "total_liability": current.get("total_liability"),
        "total_equity": current.get("total_equity"),
        "prev_revenue": prev.get("revenue") if prev else None,
    }
    df = _calc_ratios_frame(pd.DataFrame([row]))
    result = df.iloc[0][_RATIO_COLUMNS].to_dict()
    return {k: (None if pd.isna(v) else v) for k, v in result.items()}


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
        skipped = 0
        rows: list[dict] = []

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

            parsed = _parse_items(items)
            rows.append({"year": year, "report_type": report_type, **parsed})
            time.sleep(settings.dart_request_delay)

        if not rows:
            self._session.commit()
            return {"corp_code": corp_code, "synced": 0, "skipped": skipped}

        # 여러 연도치 재무제표를 DataFrame으로 구성해 지표를 벡터화 계산
        df = pd.DataFrame(rows).sort_values("year").reset_index(drop=True)
        for col in _RAW_COLUMNS:
            if col not in df.columns:
                df[col] = np.nan
        df["prev_revenue"] = df["revenue"].shift(1)

        # 배치 대상 연도 중 가장 이른 해는 DB에 저장된 전년도 매출로 성장률 기준을 보완
        # (df.loc가 반환하는 numpy.int64는 psycopg2가 바인딩 못 하므로 plain int로 변환)
        earliest_year = int(df.loc[0, "year"])
        earliest_report_type = str(df.loc[0, "report_type"])
        prev_record = self._financial_repo.find_by_year(company.id, earliest_year - 1, earliest_report_type)
        if prev_record is not None:
            df.loc[0, "prev_revenue"] = prev_record.revenue

        df = _calc_ratios_frame(df)

        synced = 0
        for _, row in df.iterrows():
            metrics = {k: (None if pd.isna(row[k]) else float(row[k])) for k in _RATIO_COLUMNS}
            self._financial_repo.upsert({
                "company_id":       company.id,
                "year":             int(row["year"]),
                "quarter":          None,
                "report_type":      row["report_type"],
                "revenue":          None if pd.isna(row["revenue"]) else int(row["revenue"]),
                "operating_profit": None if pd.isna(row["operating_profit"]) else int(row["operating_profit"]),
                "net_income":       None if pd.isna(row["net_income"]) else int(row["net_income"]),
                "total_assets":     None if pd.isna(row["total_assets"]) else int(row["total_assets"]),
                "total_liability":  None if pd.isna(row["total_liability"]) else int(row["total_liability"]),
                "total_equity":     None if pd.isna(row["total_equity"]) else int(row["total_equity"]),
                **metrics,
            })
            synced += 1

        self._session.commit()
        return {"corp_code": corp_code, "synced": synced, "skipped": skipped}

    def sync_many(self, corp_codes: list[str], years: list[int] | None = None) -> list[dict]:
        results = []
        for i, code in enumerate(corp_codes, 1):
            logger.info(f"[{i}/{len(corp_codes)}] 재무제표 동기화: {code}")
            result = self.sync_one(code, years)
            results.append(result)
        return results
