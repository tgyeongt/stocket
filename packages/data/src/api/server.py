from __future__ import annotations

"""
실시간 기업 데이터 API 서버
- Redis 응답 캐시 (TTL 1시간)
- DART/KIS API 병렬 호출
- Hot/Cold 기업 접근 추적
"""
import asyncio
import json as json_lib
import threading
from datetime import date, timedelta

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.cache import cache_get, cache_set
from src.clients.dart_client import DartClient
from src.clients.kis_client import KisClient
from src.config.settings import get_settings
from src.utils.logger import get_logger

from .financial_metrics import _calc_financial_metrics, _parse_financials
from .insights import _tags, _why_cards
from .price_metrics import _calc_price_metrics, _price_history
from .scoring import (
    _axes_distance_score,
    _calc_growth,
    _calc_momentum,
    _calc_profitability,
    _calc_stability,
    _grade,
    _overall,
)
from .sector_peers import (
    _INDUSTRY_CODE_MAP,
    SECTOR_COMPANIES,
    _compute_sector_peer_score,
    _find_corp,
    _get_corp_list,
    _preload_sector_peers,
    _sector_peer_cache,
    _sector_peer_lock,
)

logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(title="Stocket Data API")


@app.on_event("startup")
def startup_preload() -> None:
    threading.Thread(target=_preload_sector_peers, daemon=True).start()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── API 엔드포인트 ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True}


def _mark_accessed(corp_code: str) -> None:
    try:
        from src.database.connection import get_session
        from src.repositories.company_repository import CompanyRepository
        with get_session() as session:
            CompanyRepository(session).mark_accessed(corp_code)
    except Exception as e:
        logger.warning(f"lastAccessedAt 갱신 실패 [{corp_code}]: {e}")


@app.get("/company")
async def get_company(name: str, background_tasks: BackgroundTasks):
    """기업명으로 실시간 조회: Redis 캐시 → DART/KIS 병렬 호출 → 점수 계산"""
    # 1. Redis 캐시 확인
    cache_key = f"company:{name}"
    cached = cache_get(cache_key)
    if cached:
        logger.info(f"캐시 히트: {name}")
        return json_lib.loads(cached)

    corp = await asyncio.to_thread(_find_corp, name)
    if not corp:
        raise HTTPException(status_code=404, detail=f"기업을 찾을 수 없어요: {name}")

    corp_code = corp["corp_code"]
    stock_code = corp["stock_code"]
    corp_name = corp["corp_name"]
    logger.info(f"캐시 미스 → 실시간 조회: {corp_name} ({corp_code})")

    current_year = date.today().year - 1
    end_dt = date.today()
    start_dt = end_dt - timedelta(days=180)

    # 2. DART/KIS API 병렬 호출 (스레드별 독립 클라이언트)
    def _fetch_info():
        c = DartClient()
        try:
            return c.fetch_company_info(corp_code)
        finally:
            c.close()

    def _fetch_fin(year):
        c = DartClient()
        try:
            return c.fetch_financial_statement(corp_code, year)
        finally:
            c.close()

    def _fetch_prices():
        if not stock_code:
            return []
        c = KisClient()
        try:
            return c.fetch_daily_prices(
                stock_code,
                start_dt.strftime("%Y%m%d"),
                end_dt.strftime("%Y%m%d"),
            )
        finally:
            c.close()

    corp_info, fin_items_curr, fin_items_prev, prices = await asyncio.gather(
        asyncio.to_thread(_fetch_info),
        asyncio.to_thread(_fetch_fin, current_year),
        asyncio.to_thread(_fetch_fin, current_year - 1),
        asyncio.to_thread(_fetch_prices),
    )

    # 3. 지표 계산
    induty_name = None
    if corp_info and corp_info.induty_code:
        induty_name = _INDUSTRY_CODE_MAP.get(corp_info.induty_code[:3])

    curr_fin = _parse_financials(fin_items_curr)
    prev_fin = _parse_financials(fin_items_prev)
    fm = _calc_financial_metrics(curr_fin, prev_fin)
    pm = _calc_price_metrics(prices)

    axes = {
        "growth": _calc_growth(fm.get("revenue_growth_rate")),
        "stability": _calc_stability(fm.get("debt_ratio")),
        "profitability": _calc_profitability(fm.get("roe"), fm.get("operating_margin")),
        "momentum": _calc_momentum(pm.get("momentum1m"), pm.get("momentum3m"), pm.get("momentum6m")),
    }
    score = _overall(axes)

    # 4. 섹터 피어 조회
    peers = []
    if corp_info and corp_info.induty_code:
        prefix = corp_info.induty_code[:2]
        exclude_set = {stock_code or ""}
        candidates = [c for c in SECTOR_COMPANIES.get(prefix, []) if c["stockCode"] not in exclude_set]
        for c in candidates[:3]:
            sc = c["stockCode"]
            with _sector_peer_lock:
                cached_peer = _sector_peer_cache.get(sc)
            if cached_peer and cached_peer.get("axes"):
                peers.append({
                    "name": c["corpName"],
                    "score": cached_peer["score"],
                    "correlation": _axes_distance_score(axes, cached_peer["axes"]),
                })
            elif cached_peer:
                peers.append({**cached_peer, "name": c["corpName"]})
            else:
                peers.append({"name": c["corpName"], "score": 50, "correlation": 70})
        peers.sort(key=lambda p: p["correlation"], reverse=True)

    # 5. 응답 구성
    growth_rate = fm.get("revenue_growth_rate") or 7.0
    momentum6m = pm.get("momentum6m") or 0.0

    result = {
        "name": corp_name,
        "sector": induty_name or "기타",
        "indutyCode": corp_info.induty_code if corp_info else None,
        "code": stock_code or "",
        "score": score,
        "grade": _grade(score),
        "axes": axes,
        "why": _why_cards(fm, pm),
        "tags": _tags(fm, pm),
        "peers": peers,
        "simulation": {
            "baseMarketRate": round(min(30, max(0, growth_rate))),
            "baseTrend": round(100 + min(50, max(-20, momentum6m))),
            "dataYear": current_year,
            "revenueGrowthRate": round(growth_rate, 1),
            "momentum6m": round(momentum6m, 1),
        },
        "priceHistory": _price_history(prices),
    }

    # 6. Redis 캐시 저장 (TTL 1시간)
    cache_set(cache_key, json_lib.dumps(result), ttl=3600)

    # 7. Hot 기업 마킹 (백그라운드, 응답 차단 안 함)
    background_tasks.add_task(_mark_accessed, corp_code)

    return result


@app.get("/company/sector-peers")
def get_sector_peers(prefix: str, excludes: str = "", limit: int = 3):
    """같은 섹터의 큐레이션 피어 기업 목록 반환 (캐시 우선, 없으면 즉석 계산)"""
    exclude_set = {s.strip() for s in excludes.split(",") if s.strip()}
    candidates = [
        c for c in SECTOR_COMPANIES.get(prefix, [])
        if c["stockCode"] not in exclude_set
    ][:limit]

    results = []
    for c in candidates:
        sc = c["stockCode"]
        with _sector_peer_lock:
            cached = _sector_peer_cache.get(sc)
        if cached:
            # 캐시된 결과도 display_name으로 이름 보정
            results.append({**cached, "name": c["corpName"]})
        else:
            # 캐시 미스: 즉석 계산 (첫 요청 시만 발생)
            computed = _compute_sector_peer_score(sc, display_name=c["corpName"])
            if computed:
                with _sector_peer_lock:
                    _sector_peer_cache[sc] = computed
                results.append(computed)
            else:
                results.append({"name": c["corpName"], "score": 50, "correlation": 70})

    return {"data": results}


@app.get("/company/search")
def search_companies(name: str, limit: int = 20):
    """검색어와 일치하는 상장 기업 목록 반환 (자동완성용)"""
    corps = _get_corp_list()
    results = [
        {"corpName": c["corp_name"], "stockCode": c["stock_code"]}
        for c in corps
        if name in c["corp_name"] and c.get("stock_code")
    ]
    return {"data": results[:limit]}
