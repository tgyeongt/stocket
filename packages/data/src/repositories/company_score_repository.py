from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.database.models import CompanyScore

# snake_case 입력 키 → camelCase DB 컬럼명
_FIELD_MAP = {
    "company_id": "companyId",
    "growth": "growth",
    "stability": "stability",
    "profitability": "profitability",
    "momentum": "momentum",
    "overall": "overall",
    "grade": "grade",
}


class CompanyScoreRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        mapped = {_FIELD_MAP.get(k, k): v for k, v in data.items()}
        existing = (
            self._s.query(CompanyScore)
            .filter_by(companyId=mapped["companyId"])
            .first()
        )
        if existing:
            for key, val in mapped.items():
                if key != "companyId" and hasattr(existing, key):
                    setattr(existing, key, val)
        else:
            self._s.add(CompanyScore(id=str(uuid.uuid4()), **mapped))

    def find_by_company_id(self, company_id: str) -> CompanyScore | None:
        return self._s.query(CompanyScore).filter_by(companyId=company_id).first()
