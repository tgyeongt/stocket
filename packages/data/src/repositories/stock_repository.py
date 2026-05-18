from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy.orm import Session

from src.database.models import StockMetrics, StockPrice

# snake_case 입력 키 → camelCase DB 컬럼명
_PRICE_MAP = {
    "company_id": "companyId",
    "date": "date",
    "open": "open",
    "high": "high",
    "low": "low",
    "close": "close",
    "volume": "volume",
    "change_rate": "changeRate",
}

_METRICS_MAP = {
    "company_id": "companyId",
    "calc_date": "calcDate",
    "current_price": "currentPrice",
    "price_change": "priceChange",
    "volatility20d": "volatility20d",
    "volatility60d": "volatility60d",
    "momentum1m": "momentum1m",
    "momentum3m": "momentum3m",
    "momentum6m": "momentum6m",
    "ma20": "ma20",
    "ma60": "ma60",
    "ma120": "ma120",
    "avg_volume20d": "avgVolume20d",
}


class StockRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert_price(self, data: dict) -> None:
        mapped = {_PRICE_MAP.get(k, k): v for k, v in data.items()}
        existing = (
            self._s.query(StockPrice)
            .filter_by(companyId=mapped["companyId"], date=mapped["date"])
            .first()
        )
        if existing:
            for key, val in mapped.items():
                if key not in ("companyId", "date") and hasattr(existing, key):
                    setattr(existing, key, val)
        else:
            self._s.add(StockPrice(id=str(uuid.uuid4()), **mapped))

    def upsert_metrics(self, data: dict) -> None:
        mapped = {_METRICS_MAP.get(k, k): v for k, v in data.items()}
        existing = (
            self._s.query(StockMetrics)
            .filter_by(companyId=mapped["companyId"], calcDate=mapped["calcDate"])
            .first()
        )
        if existing:
            for key, val in mapped.items():
                if key not in ("companyId", "calcDate") and hasattr(existing, key):
                    setattr(existing, key, val)
        else:
            self._s.add(StockMetrics(id=str(uuid.uuid4()), **mapped))

    def find_prices(self, company_id: str, limit: int = 130) -> list[StockPrice]:
        return (
            self._s.query(StockPrice)
            .filter_by(companyId=company_id)
            .order_by(StockPrice.date.desc())
            .limit(limit)
            .all()
        )

    def find_latest_metrics(self, company_id: str) -> StockMetrics | None:
        return (
            self._s.query(StockMetrics)
            .filter_by(companyId=company_id)
            .order_by(StockMetrics.calcDate.desc())
            .first()
        )
