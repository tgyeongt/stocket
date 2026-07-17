from __future__ import annotations

from sqlalchemy.orm import Session

from src.database.models import StockMetrics, StockPrice
from src.repositories._upsert import snake_to_camel, upsert_by_filter


class StockRepository:
    def __init__(self, session: Session) -> None:
        self._s = session

    def upsert_price(self, data: dict) -> None:
        mapped = {snake_to_camel(k): v for k, v in data.items()}
        upsert_by_filter(self._s, StockPrice, mapped, ["companyId", "date"])

    def upsert_metrics(self, data: dict) -> None:
        mapped = {snake_to_camel(k): v for k, v in data.items()}
        upsert_by_filter(self._s, StockMetrics, mapped, ["companyId", "calcDate"])

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
