from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.database.models import FinancialStatement

# snake_case 입력 키 → camelCase DB 컬럼명
_FIELD_MAP = {
    "company_id": "companyId",
    "year": "year",
    "quarter": "quarter",
    "report_type": "reportType",
    "revenue": "revenue",
    "operating_profit": "operatingProfit",
    "net_income": "netIncome",
    "total_assets": "totalAssets",
    "total_liability": "totalLiability",
    "total_equity": "totalEquity",
    "revenue_growth_rate": "revenueGrowthRate",
    "operating_margin": "operatingMargin",
    "debt_ratio": "debtRatio",
    "roe": "roe",
    "roa": "roa",
}

_ID_FIELDS = {"companyId", "year", "quarter", "reportType"}


class FinancialRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        mapped = {_FIELD_MAP.get(k, k): v for k, v in data.items()}
        existing = (
            self._s.query(FinancialStatement)
            .filter_by(
                companyId=mapped["companyId"],
                year=mapped["year"],
                quarter=mapped.get("quarter"),
                reportType=mapped["reportType"],
            )
            .first()
        )
        if existing:
            for key, val in mapped.items():
                if key not in _ID_FIELDS and hasattr(existing, key):
                    setattr(existing, key, val)
        else:
            self._s.add(FinancialStatement(id=str(uuid.uuid4()), **mapped))

    def find_by_year(
        self,
        company_id: str,
        year: int,
        report_type: str,
        quarter: int | None = None,
    ) -> FinancialStatement | None:
        return (
            self._s.query(FinancialStatement)
            .filter_by(
                companyId=company_id,
                year=year,
                quarter=quarter,
                reportType=report_type,
            )
            .first()
        )
