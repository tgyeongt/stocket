from __future__ import annotations

import math
from datetime import date
from statistics import mean, stdev

from sqlalchemy.orm import Session

from src.repositories.company_repository import CompanyRepository
from src.repositories.stock_repository import StockRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)


def _calc_volatility(returns: list[float], n: int) -> float | None:
    recent = returns[-n:] if len(returns) >= n else returns
    if len(recent) < 2:
        return None
    try:
        s = stdev(recent)
        return round(s * math.sqrt(252) * 100, 2)
    except Exception:
        return None


def _calc_momentum(closes: list[int], days: int) -> float | None:
    if len(closes) < days + 1:
        return None
    ref = closes[-(days + 1)]
    if ref == 0:
        return None
    return round((closes[-1] - ref) / ref * 100, 2)


def _calc_ma(closes: list[int], n: int) -> float | None:
    if len(closes) < n:
        return None
    return round(mean(closes[-n:]), 2)


class MetricsService:
    def __init__(self, session: Session) -> None:
        self._s = session
        self._company_repo = CompanyRepository(session)
        self._stock_repo = StockRepository(session)

    def calc_one(self, corp_code: str) -> dict:
        company = self._company_repo.find_by_corp_code(corp_code)
        if not company:
            return {"corp_code": corp_code, "status": "not_found"}

        prices = self._stock_repo.find_prices(company.id, limit=130)
        if len(prices) < 2:
            return {"corp_code": corp_code, "status": "insufficient_data"}

        # find_prices returns descending; sort ascending for calculations
        prices_asc = sorted(prices, key=lambda p: p.date)
        closes = [p.close for p in prices_asc]
        volumes = [p.volume for p in prices_asc]
        today = prices_asc[-1].date

        daily_returns = [
            (closes[i] - closes[i - 1]) / closes[i - 1]
            for i in range(1, len(closes))
        ]

        current_price = closes[-1]
        prev_price = closes[-2]
        price_change = round((current_price - prev_price) / prev_price * 100, 2) if prev_price else None
        avg_vol20 = int(mean(volumes[-20:])) if len(volumes) >= 20 else None

        metrics = {
            "company_id": company.id,
            "calc_date": today,
            "current_price": current_price,
            "price_change": price_change,
            "volatility20d": _calc_volatility(daily_returns, 20),
            "volatility60d": _calc_volatility(daily_returns, 60),
            "momentum1m": _calc_momentum(closes, 22),
            "momentum3m": _calc_momentum(closes, 66),
            "momentum6m": _calc_momentum(closes, 126),
            "ma20": _calc_ma(closes, 20),
            "ma60": _calc_ma(closes, 60),
            "ma120": _calc_ma(closes, 120),
            "avg_volume20d": avg_vol20,
        }

        self._stock_repo.upsert_metrics(metrics)
        self._s.commit()
        logger.debug(f"[{corp_code}] 지표 계산 완료")
        return {"corp_code": corp_code, "status": "ok"}

    def calc_many(self, corp_codes: list[str]) -> dict:
        ok, failed = 0, 0
        for code in corp_codes:
            result = self.calc_one(code)
            if result["status"] == "ok":
                ok += 1
            else:
                failed += 1
                logger.warning(f"[{code}] 지표 계산 실패: {result['status']}")
        return {"ok": ok, "failed": failed}
