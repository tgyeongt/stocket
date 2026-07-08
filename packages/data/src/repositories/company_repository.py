from __future__ import annotations

# src/repositories/company_repository.py
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database.models import Company

# snake_case 입력 키 → camelCase DB 컬럼명
_FIELD_MAP = {
    "corp_code": "corpCode",
    "corp_name": "corpName",
    "stock_code": "stockCode",
    "induty_code": "indutyCode",
    "induty_name": "indutyName",
    "sector": "sector",
    "market": "market",
    "ceo_name": "ceoName",
}


class CompanyRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        existing = self._s.query(Company).filter_by(corpCode=data["corp_code"]).first()
        if existing:
            for snake_key, val in data.items():
                camel = _FIELD_MAP.get(snake_key, snake_key)
                if camel != "corpCode" and hasattr(existing, camel):
                    setattr(existing, camel, val)
        else:
            mapped = {_FIELD_MAP.get(k, k): v for k, v in data.items()}
            self._s.add(Company(id=str(uuid.uuid4()), **mapped))

    def upsert_bulk(self, rows: list[dict]) -> int:
        if not rows:
            return 0
        self._s.execute(
            text("""
                INSERT INTO companies (id, "corpCode", "corpName", "stockCode", "createdAt", "updatedAt")
                VALUES (gen_random_uuid()::text, :corp_code, :corp_name, :stock_code, NOW(), NOW())
                ON CONFLICT ("corpCode") DO UPDATE SET
                    "corpName"  = EXCLUDED."corpName",
                    "stockCode" = EXCLUDED."stockCode",
                    "updatedAt" = NOW()
            """),
            rows,
        )
        return len(rows)

    def find_by_corp_code(self, corp_code: str) -> Company | None:
        return self._s.query(Company).filter_by(corpCode=corp_code).first()

    def find_all_corp_codes(self, listed_only: bool = True) -> list[str]:
        q = self._s.query(Company.corpCode)
        if listed_only:
            q = q.filter(Company.stockCode.isnot(None))
        return [row[0] for row in q.all()]

    def find_without_induty(self, limit: int = 200) -> list[str]:
        rows = (
            self._s.query(Company.corpCode)
            .filter(Company.indutyCode.is_(None))
            .limit(limit)
            .all()
        )
        return [r[0] for r in rows]

    def update_company_info(self, corp_code: str, data: dict) -> None:
        self._s.query(Company).filter_by(corpCode=corp_code).update(data)
