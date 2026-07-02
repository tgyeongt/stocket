from __future__ import annotations

# DART 재무제표 원자료 파싱 및 재무 비율(성장률/마진/부채비율/ROE/ROA) 계산

from typing import Optional

ACCOUNT_MAP = {
    "매출액": "revenue",
    "수익(매출액)": "revenue",
    "영업수익": "revenue",
    "영업이익": "operating_profit",
    "영업이익(손실)": "operating_profit",
    "당기순이익": "net_income",
    "당기순이익(손실)": "net_income",
    "자산총계": "total_assets",
    "부채총계": "total_liability",
    "자본총계": "total_equity",
}


def _parse_amount(s: str) -> Optional[int]:
    cleaned = s.replace(",", "").strip()
    if not cleaned or cleaned == "-":
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def _parse_financials(items) -> dict:
    result: dict = {}
    for item in items:
        field = ACCOUNT_MAP.get(item.account_nm)
        if field and field not in result:
            v = _parse_amount(item.thstrm_amount)
            if v is not None:
                result[field] = v
    return result


def _safe_div(a, b) -> Optional[float]:
    if a is not None and b and b != 0:
        return a / b
    return None


def _calc_financial_metrics(curr: dict, prev: dict) -> dict:
    rev = curr.get("revenue")
    op = curr.get("operating_profit")
    ni = curr.get("net_income")
    assets = curr.get("total_assets")
    liab = curr.get("total_liability")
    equity = curr.get("total_equity")
    prev_rev = prev.get("revenue")

    def _safe_pct(a, b):
        v = _safe_div(a, b)
        return v * 100 if v is not None else None

    growth = _safe_pct(rev - prev_rev, prev_rev) if rev and prev_rev else None
    margin = _safe_pct(op, rev)
    debt = _safe_pct(liab, equity)
    roe = _safe_pct(ni, equity)
    roa = _safe_pct(ni, assets)
    return {
        "revenue_growth_rate": round(growth, 1) if growth is not None else None,
        "operating_margin": round(margin, 1) if margin is not None else None,
        "debt_ratio": round(debt, 1) if debt is not None else None,
        "roe": round(roe, 1) if roe is not None else None,
        "roa": round(roa, 1) if roa is not None else None,
    }
