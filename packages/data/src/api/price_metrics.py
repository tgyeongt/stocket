from __future__ import annotations

# KIS 일별 시세 → 변동성/모멘텀/이동평균 등 파생 지표 및 가격 히스토리 계산

import math
from statistics import mean, stdev


def _calc_price_metrics(prices) -> dict:
    if len(prices) < 2:
        return {}
    asc = sorted(prices, key=lambda p: p.date)
    closes = [p.close for p in asc]
    volumes = [p.volume for p in asc]

    returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]

    def vol(n):
        r = returns[-n:] if len(returns) >= n else returns
        if len(r) < 2:
            return None
        try:
            return round(stdev(r) * math.sqrt(252) * 100, 2)
        except Exception:
            return None

    def mom(days):
        if len(closes) < days + 1:
            return None
        ref = closes[-(days + 1)]
        return round((closes[-1] - ref) / ref * 100, 2) if ref else None

    def ma(n):
        return round(mean(closes[-n:]), 2) if len(closes) >= n else None

    current = closes[-1]
    prev = closes[-2]
    return {
        "current_price": current,
        "price_change": round((current - prev) / prev * 100, 2) if prev else None,
        "volatility20d": vol(20),
        "volatility60d": vol(60),
        "momentum1m": mom(22),
        "momentum3m": mom(66),
        "momentum6m": mom(126),
        "ma20": ma(20),
        "ma60": ma(60),
        "ma120": ma(120),
        "avg_volume20d": int(mean(volumes[-20:])) if len(volumes) >= 20 else None,
    }


def _price_history(prices) -> list[dict]:
    asc = sorted(prices, key=lambda x: x.date)[-90:]
    result = []
    for p in asc:
        if hasattr(p.date, "isoformat"):
            date_str = p.date.isoformat()
        else:
            d = str(p.date)
            # KIS returns YYYYMMDD (8 chars); convert to YYYY-MM-DD
            date_str = f"{d[:4]}-{d[4:6]}-{d[6:8]}" if len(d) == 8 else d[:10]
        result.append({"date": date_str, "price": p.close})
    return result
