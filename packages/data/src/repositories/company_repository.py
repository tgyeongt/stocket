# src/repositories/company_repository.py
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database.models import Company


class CompanyRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert(self, data: dict) -> None:
        """
        corp_code 기준 upsert
        data 키: corp_code, corp_name, stock_code, induty_code,
                 induty_name, sector, market, ceo_name
        """
        existing = self._s.query(Company).filter_by(corp_code=data["corp_code"]).first()

        if existing:
            for key, val in data.items():
                if key != "corp_code" and hasattr(existing, key):
                    setattr(existing, key, val)
        else:
            self._s.add(Company(id=str(uuid.uuid4()), **data))

    def upsert_bulk(self, rows: list[dict]) -> int:
        """
        대량 upsert - raw SQL로 성능 최적화
        반환: upsert된 행 수
        """
        if not rows:
            return 0

        self._s.execute(
            text("""
                INSERT INTO companies (id, corp_code, corp_name, stock_code, created_at, updated_at)
                VALUES (gen_random_uuid()::text, :corp_code, :corp_name, :stock_code, NOW(), NOW())
                ON CONFLICT (corp_code) DO UPDATE SET
                    corp_name  = EXCLUDED.corp_name,
                    stock_code = EXCLUDED.stock_code,
                    updated_at = NOW()
            """),
            rows,
        )
        return len(rows)

    def find_by_corp_code(self, corp_code: str) -> Company | None:
        return self._s.query(Company).filter_by(corp_code=corp_code).first()

    def find_all_corp_codes(self, listed_only: bool = True) -> list[str]:
        q = self._s.query(Company.corp_code)
        if listed_only:
            q = q.filter(Company.stock_code.isnot(None))
        return [row[0] for row in q.all()]

    def find_without_induty(self, limit: int = 200) -> list[str]:
        """업종코드가 없는 기업 목록 (enrich 대상)"""
        rows = (
            self._s.query(Company.corp_code)
            .filter(Company.induty_code.is_(None))
            .limit(limit)
            .all()
        )
        return [r[0] for r in rows]

    def update_company_info(self, corp_code: str, data: dict) -> None:
        self._s.query(Company).filter_by(corp_code=corp_code).update(data)
