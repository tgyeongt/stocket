from __future__ import annotations

# src/repositories/company_repository.py
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database.models import Company
from src.repositories._upsert import snake_to_camel, upsert_by_filter


class CompanyRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        mapped = {snake_to_camel(k): v for k, v in data.items()}
        upsert_by_filter(self._s, Company, mapped, ["corpCode"])

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

    def find_all_corp_codes(self) -> list[str]:
        rows = self._s.query(Company.corpCode).filter(Company.stockCode.isnot(None)).all()
        return [row[0] for row in rows]

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
