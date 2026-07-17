from __future__ import annotations

from sqlalchemy.orm import Session

from src.database.models import CompanyScore
from src.repositories._upsert import snake_to_camel, upsert_by_filter


class CompanyScoreRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        mapped = {snake_to_camel(k): v for k, v in data.items()}
        upsert_by_filter(self._s, CompanyScore, mapped, ["companyId"])

    def find_by_company_id(self, company_id: str) -> CompanyScore | None:
        return self._s.query(CompanyScore).filter_by(companyId=company_id).first()
