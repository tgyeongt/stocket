from __future__ import annotations

import time
from datetime import date, timedelta

from sqlalchemy.orm import Session

from src.clients.kis_client import KisClient
from src.repositories.company_repository import CompanyRepository
from src.repositories.stock_repository import StockRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)


class StockSyncService:
    def __init__(self, session: Session, kis_client: KisClient) -> None:
        self._s = session
        self._company_repo = CompanyRepository(session)
        self._stock_repo = StockRepository(session)
        self._kis = kis_client

    def sync_one(self, corp_code: str, days: int = 120) -> dict:
        company = self._company_repo.find_by_corp_code(corp_code)
        if not company or not company.stock_code:
            return {"corp_code": corp_code, "saved": 0, "status": "skip"}

        end_dt = date.today()
        start_dt = end_dt - timedelta(days=days)

        raw_prices = self._kis.fetch_daily_prices(
            company.stock_code,
            start_dt.strftime("%Y%m%d"),
            end_dt.strftime("%Y%m%d"),
        )

        saved = 0
        for p in raw_prices:
            price_date = date(int(p.date[:4]), int(p.date[4:6]), int(p.date[6:]))
            self._stock_repo.upsert_price({
                "company_id": company.id,
                "date": price_date,
                "open": p.open,
                "high": p.high,
                "low": p.low,
                "close": p.close,
                "volume": p.volume,
                "change_rate": p.change_rate,
            })
            saved += 1

        self._s.commit()
        return {"corp_code": corp_code, "saved": saved, "status": "ok"}

    def sync_many(self, corp_codes: list[str], days: int = 120) -> list[dict]:
        results = []
        for i, code in enumerate(corp_codes, 1):
            logger.info(f"[{i}/{len(corp_codes)}] 주가 동기화: {code}")
            result = self.sync_one(code, days)
            results.append(result)
            time.sleep(0.1)
        return results
