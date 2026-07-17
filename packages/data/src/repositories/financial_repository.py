from __future__ import annotations

from sqlalchemy.orm import Session

from src.database.models import FinancialStatement
from src.repositories._upsert import snake_to_camel, upsert_by_filter


class FinancialRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        mapped = {snake_to_camel(k): v for k, v in data.items()}
        upsert_by_filter(
            self._s, FinancialStatement, mapped,
            ["companyId", "year", "quarter", "reportType"],
        )

    def find_by_year(
        self,
        company_id: str,
        year: int,
        report_type: str,
    ) -> FinancialStatement | None:
        return (
            self._s.query(FinancialStatement)
            .filter_by(companyId=company_id, year=year, quarter=None, reportType=report_type)
            .first()
        )

    def find_latest(self, company_id: str) -> FinancialStatement | None:
        return (
            self._s.query(FinancialStatement)
            .filter_by(companyId=company_id)
            .order_by(FinancialStatement.year.desc(), FinancialStatement.quarter.desc())
            .first()
        )
