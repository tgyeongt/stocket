from __future__ import annotations

"""
실시간 기업 데이터 API 서버
- DART 기업 목록은 메모리에 24시간 캐시
- 검색 시 DART(재무) + KIS(주가) 실시간 호출 후 성장성 점수 계산
"""
import math
import time
import threading
from datetime import date, timedelta
from statistics import mean, stdev
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.clients.dart_client import DartClient
from src.clients.kis_client import KisClient
from src.config.settings import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

# DART 업종코드 앞 3자리 → 한글 이름
_INDUSTRY_CODE_MAP: dict[str, str] = {
    "261": "반도체",
    "262": "반도체",
    "263": "전자부품",
    "264": "전자/통신장비",
    "265": "영상음향기기",
    "271": "전자부품",
    "279": "전자제품",
    "281": "전기장비",
    "282": "배터리",
    "291": "이차전지",
    "292": "기계",
    "351": "통신서비스",
    "631": "소프트웨어",
    "632": "IT서비스",
    "641": "은행",
    "649": "금융",
    "651": "보험",
    "661": "증권",
    "461": "도매",
    "471": "소매",
    "551": "숙박",
    "561": "음식",
    "491": "운수",
    "501": "해운",
    "511": "항공",
}

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

# ── 메모리 캐시 ────────────────────────────────────────────────
_corp_cache: list[dict] = []
_corp_cache_at: float = 0.0
CACHE_TTL = 86400  # 24시간

# ── 섹터별 큐레이션 기업 목록 (indutyCode 앞 2자리 → 종목코드 목록) ──
SECTOR_COMPANIES: dict[str, list[dict]] = {
    "26": [  # 반도체 · 전자부품
        {"corpName": "DB하이텍",    "stockCode": "000990"},
        {"corpName": "한미반도체",  "stockCode": "042700"},
        {"corpName": "리노공업",    "stockCode": "058470"},
    ],
    "63": [  # 소프트웨어 · 인터넷
        {"corpName": "크래프톤",    "stockCode": "259960"},
        {"corpName": "엔씨소프트",  "stockCode": "036570"},
        {"corpName": "넷마블",      "stockCode": "251270"},
    ],
    "28": [  # 배터리 · 화학
        {"corpName": "삼성SDI",     "stockCode": "006400"},
        {"corpName": "포스코퓨처엠","stockCode": "003670"},
        {"corpName": "에코프로비엠","stockCode": "247540"},
    ],
}

# stockCode → 점수/이름 캐시 (서버 시작 후 백그라운드에서 채워짐)
_sector_peer_cache: dict[str, dict] = {}
_sector_peer_lock = threading.Lock()


def _get_corp_list() -> list[dict]:
    global _corp_cache, _corp_cache_at
    if _corp_cache and time.time() - _corp_cache_at < CACHE_TTL:
        return _corp_cache
    logger.info("DART 기업 목록 캐시 갱신 중...")
    dart = DartClient()
    try:
        _corp_cache = dart.fetch_corp_code_list()
        _corp_cache_at = time.time()
        logger.info(f"캐시 완료: {len(_corp_cache)}개 기업")
    finally:
        dart.close()
    return _corp_cache


def _find_corp_by_stock(stock_code: str) -> Optional[dict]:
    for c in _get_corp_list():
        if c.get("stock_code") == stock_code:
            return c
    return None


def _compute_sector_peer_score(stock_code: str, display_name: Optional[str] = None) -> Optional[dict]:
    """DART 재무 데이터만으로 피어 점수 계산 (KIS 제외 → 빠른 응답)"""
    corp = _find_corp_by_stock(stock_code)
    if not corp:
        return None
    corp_code = corp["corp_code"]
    corp_name = display_name or corp["corp_name"]
    dart = DartClient()
    try:
        current_year = date.today().year - 1
        fin_curr = dart.fetch_financial_statement(corp_code, current_year)
        fin_prev = dart.fetch_financial_statement(corp_code, current_year - 1)
        curr = _parse_financials(fin_curr)
        prev = _parse_financials(fin_prev)
        fm = _calc_financial_metrics(curr, prev)
        axes = {
            "growth": _calc_growth(fm.get("revenue_growth_rate")),
            "stability": _calc_stability(fm.get("debt_ratio")),
            "profitability": _calc_profitability(fm.get("roe"), fm.get("operating_margin")),
            "momentum": 50,  # 가격 데이터 없이는 50(중립)
        }
        return {"name": corp_name, "score": _overall(axes), "correlation": 72}
    except Exception as e:
        logger.warning(f"섹터 피어 점수 계산 실패 [{stock_code}]: {e}")
        return None
    finally:
        dart.close()


def _preload_sector_peers() -> None:
    """서버 시작 시 백그라운드에서 섹터 피어 점수 사전 계산"""
    all_companies = [c for peers in SECTOR_COMPANIES.values() for c in peers]
    for company in all_companies:
        sc = company["stockCode"]
        with _sector_peer_lock:
            if sc in _sector_peer_cache:
                continue
        result = _compute_sector_peer_score(sc, display_name=company["corpName"])
        if result:
            with _sector_peer_lock:
                _sector_peer_cache[sc] = result
            logger.info(f"섹터 피어 캐시 완료: {result['name']} ({result['score']}점)")


def _find_corp(name: str) -> Optional[dict]:
    corps = _get_corp_list()
    # 정확히 일치하는 기업 우선
    for c in corps:
        if c["corp_name"] == name:
            return c
    # 부분 일치
    for c in corps:
        if name in c["corp_name"]:
            return c
    return None


# ── 지표 계산 ──────────────────────────────────────────────────

def _clamp(v: float) -> int:
    return int(min(100, max(0, round(v))))


def _calc_growth(rate: Optional[float]) -> int:
    return _clamp(50 + (rate or 0) * 2)


def _calc_stability(debt: Optional[float]) -> int:
    if debt is None:
        return 50
    if debt <= 30:
        return 90
    if debt <= 80:
        return _clamp(90 - (debt - 30) / 50 * 20)
    if debt <= 150:
        return _clamp(70 - (debt - 80) / 70 * 20)
    if debt <= 300:
        return _clamp(50 - (debt - 150) / 150 * 25)
    return _clamp(25 - (debt - 300) / 200 * 20)


def _calc_profitability(roe: Optional[float], margin: Optional[float]) -> int:
    roe_s = _clamp(50 + (roe or 0) * 2.5)
    margin_s = _clamp(50 + (margin or 0) * 2)
    return _clamp((roe_s + margin_s) / 2)


def _calc_momentum(m1, m3, m6) -> int:
    s1 = _clamp(50 + (m1 or 0) * 3)
    s3 = _clamp(50 + (m3 or 0) * 1.5)
    s6 = _clamp(50 + (m6 or 0) * 0.8)
    return _clamp(s1 * 0.5 + s3 * 0.3 + s6 * 0.2)


def _overall(axes: dict) -> int:
    return _clamp(
        axes["growth"] * 0.35
        + axes["stability"] * 0.25
        + axes["profitability"] * 0.25
        + axes["momentum"] * 0.15
    )


def _grade(score: int) -> str:
    if score >= 85:
        return "성장 잠재력 매우 높음"
    if score >= 75:
        return "성장 잠재력 높음"
    if score >= 60:
        return "성장 잠재력 보통"
    if score >= 45:
        return "성장 잠재력 낮음"
    return "성장 잠재력 매우 낮음"


# ── 재무 지표 파싱 ─────────────────────────────────────────────

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

    growth = _safe_div(rev - prev_rev, prev_rev) * 100 if rev and prev_rev else None
    margin = _safe_div(op, rev) * 100 if op is not None else None
    debt = _safe_div(liab, equity) * 100 if liab is not None else None
    roe = _safe_div(ni, equity) * 100 if ni is not None else None
    roa = _safe_div(ni, assets) * 100 if ni is not None else None
    return {
        "revenue_growth_rate": round(growth, 1) if growth is not None else None,
        "operating_margin": round(margin, 1) if margin is not None else None,
        "debt_ratio": round(debt, 1) if debt is not None else None,
        "roe": round(roe, 1) if roe is not None else None,
        "roa": round(roa, 1) if roa is not None else None,
    }


# ── 주가 파생 지표 계산 ────────────────────────────────────────

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


# ── Why 카드 생성 ──────────────────────────────────────────────

def _why_cards(fm: dict, pm: dict) -> list[dict]:
    cards = []
    rate = fm.get("revenue_growth_rate")
    debt = fm.get("debt_ratio")
    roe = fm.get("roe")
    m1 = pm.get("momentum1m")
    ma20 = pm.get("ma20")
    ma60 = pm.get("ma60")

    # ── 매출 성장률 ──
    if rate is not None:
        if rate >= 15:
            cards.append({"icon": "📈", "title": "매출이 빠르게 성장하고 있어요",
                "body": f'매출 성장률이 <strong class="text-green-400">{rate:+.1f}%</strong>로, 업계 평균을 크게 웃도는 강한 성장세예요.'})
        elif rate >= 5:
            cards.append({"icon": "📊", "title": "매출이 꾸준히 성장하고 있어요",
                "body": f'매출이 <strong class="text-green-400">{rate:+.1f}%</strong> 성장하며 안정적인 성장 흐름을 이어가고 있어요.'})
        elif rate >= 0:
            cards.append({"icon": "📉", "title": "매출 성장이 정체되고 있어요",
                "body": f'매출 성장률이 <strong class="text-yellow-400">{rate:+.1f}%</strong>로 낮아, 새로운 성장 동력이 필요한 시점이에요.'})
        else:
            cards.append({"icon": "⚠️", "title": "매출이 감소하고 있어요",
                "body": f'매출이 <strong class="text-red-400">{rate:+.1f}%</strong> 줄었어요. 시장 수요나 경쟁 환경 변화를 주목할 필요가 있어요.'})

    # ── 부채비율 ──
    if debt is not None:
        if debt <= 60:
            cards.append({"icon": "🛡️", "title": "재무 구조가 매우 탄탄해요",
                "body": f'부채비율이 <strong class="text-green-400">{debt:.1f}%</strong>로 낮아, 재무 건전성이 우수해요.'})
        elif debt <= 150:
            cards.append({"icon": "📋", "title": "재무 구조는 무난한 편이에요",
                "body": f'부채비율이 <strong class="text-yellow-400">{debt:.1f}%</strong>로 업종 평균 수준이에요.'})
        else:
            cards.append({"icon": "⚠️", "title": "부채 부담이 높은 편이에요",
                "body": f'부채비율이 <strong class="text-red-400">{debt:.1f}%</strong>로 높아, 금리 환경 변화에 취약할 수 있어요.'})

    # ── ROE ──
    if roe is not None:
        if roe >= 15:
            cards.append({"icon": "💪", "title": "자본 효율이 매우 높아요",
                "body": f'ROE가 <strong class="text-green-400">{roe:.1f}%</strong>로, 투자한 자본 대비 수익 창출 능력이 탁월해요.'})
        elif roe >= 8:
            cards.append({"icon": "💡", "title": "자본 효율이 양호해요",
                "body": f'ROE가 <strong class="text-green-400">{roe:.1f}%</strong>로 안정적인 수익을 내고 있어요.'})
        elif roe >= 0:
            cards.append({"icon": "📉", "title": "자본 효율이 낮아요",
                "body": f'ROE가 <strong class="text-yellow-400">{roe:.1f}%</strong>로, 자본 활용 효율 개선이 필요해요.'})
        else:
            cards.append({"icon": "⚠️", "title": "자본이 손실을 내고 있어요",
                "body": f'ROE가 <strong class="text-red-400">{roe:.1f}%</strong>로 마이너스예요. 수익성 회복이 중요한 과제예요.'})

    # ── 주가 모멘텀 ──
    if m1 is not None:
        if m1 >= 10:
            cards.append({"icon": "🚀", "title": "주가 상승 모멘텀이 강해요",
                "body": f'최근 한 달 수익률이 <strong class="text-green-400">{m1:+.1f}%</strong>로, 시장의 강한 기대를 받고 있어요.'})
        elif m1 >= 0:
            if ma20 and ma60 and ma20 > ma60:
                cards.append({"icon": "📊", "title": "주가가 상승 추세예요",
                    "body": '20일 이동평균이 60일 이동평균 위에 위치하며 상승 흐름을 유지하고 있어요.'})
            else:
                cards.append({"icon": "📊", "title": "주가가 보합세를 유지해요",
                    "body": f'최근 한 달 수익률이 <strong class="text-yellow-400">{m1:+.1f}%</strong>로, 횡보 구간에서 방향성을 탐색 중이에요.'})
        elif m1 >= -10:
            cards.append({"icon": "📉", "title": "주가가 조정을 받고 있어요",
                "body": f'최근 한 달 수익률이 <strong class="text-yellow-400">{m1:+.1f}%</strong>로, 단기 조정 구간에 있어요.'})
        else:
            cards.append({"icon": "⚠️", "title": "주가가 큰 폭으로 하락했어요",
                "body": f'최근 한 달 수익률이 <strong class="text-red-400">{m1:+.1f}%</strong>로, 시장 신뢰 회복이 필요한 상황이에요.'})

    if len(cards) < 2:
        cards.append({"icon": "🔍", "title": "데이터를 분석하고 있어요",
            "body": "더 많은 재무 데이터가 수집되면 상세한 분석을 제공할 수 있어요."})
    return cards[:4]


def _tags(fm: dict, pm: dict) -> list[dict]:
    tags = []
    if fm.get("roe") is not None:
        tags.append({"label": "ROE", "value": f'{fm["roe"]:.1f}%'})
    if fm.get("operating_margin") is not None:
        tags.append({"label": "영업이익률", "value": f'{fm["operating_margin"]:.1f}%'})
    if fm.get("debt_ratio") is not None:
        tags.append({"label": "부채비율", "value": f'{fm["debt_ratio"]:.1f}%'})
    if fm.get("revenue_growth_rate") is not None:
        v = fm["revenue_growth_rate"]
        tags.append({"label": "매출 YoY", "value": f'{v:+.1f}%'})
    if pm.get("momentum1m") is not None:
        v = pm["momentum1m"]
        tags.append({"label": "1M 모멘텀", "value": f'{v:+.1f}%'})
    return tags


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


# ── API 엔드포인트 ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True}


@app.get("/company")
def get_company(name: str):
    """기업명으로 실시간 조회: DART 재무 + KIS 주가 → 성장성 점수 계산"""
    corp = _find_corp(name)
    if not corp:
        raise HTTPException(status_code=404, detail=f"기업을 찾을 수 없어요: {name}")

    corp_code = corp["corp_code"]
    stock_code = corp["stock_code"]
    corp_name = corp["corp_name"]
    logger.info(f"실시간 조회: {corp_name} ({corp_code})")

    dart = DartClient()
    kis = KisClient()
    try:
        # 1. 기업 상세 정보 (섹터/업종)
        corp_info = dart.fetch_company_info(corp_code)
        induty_name = None
        if corp_info and corp_info.induty_code:
            induty_name = _INDUSTRY_CODE_MAP.get(corp_info.induty_code[:3])

        # 2. 재무제표 (올해 - 1, 올해 - 2년 성장률 계산용)
        current_year = date.today().year - 1  # 전년도 사업보고서
        fin_items_curr = dart.fetch_financial_statement(corp_code, current_year)
        fin_items_prev = dart.fetch_financial_statement(corp_code, current_year - 1)

        curr_fin = _parse_financials(fin_items_curr)
        prev_fin = _parse_financials(fin_items_prev)
        fm = _calc_financial_metrics(curr_fin, prev_fin)

        # 3. 주가 데이터 (최근 130일)
        end_dt = date.today()
        start_dt = end_dt - timedelta(days=180)
        prices = []
        if stock_code:
            prices = kis.fetch_daily_prices(
                stock_code,
                start_dt.strftime("%Y%m%d"),
                end_dt.strftime("%Y%m%d"),
            )

        pm = _calc_price_metrics(prices)

        # 4. 성장성 점수 계산
        axes = {
            "growth": _calc_growth(fm.get("revenue_growth_rate")),
            "stability": _calc_stability(fm.get("debt_ratio")),
            "profitability": _calc_profitability(fm.get("roe"), fm.get("operating_margin")),
            "momentum": _calc_momentum(pm.get("momentum1m"), pm.get("momentum3m"), pm.get("momentum6m")),
        }
        score = _overall(axes)

        # 5. 응답 구성
        growth_rate = fm.get("revenue_growth_rate") or 7.0
        momentum6m = pm.get("momentum6m") or 0.0

        return {
            "name": corp_name,
            "sector": induty_name or "기타",
            "code": stock_code or "",
            "score": score,
            "grade": _grade(score),
            "axes": axes,
            "why": _why_cards(fm, pm),
            "tags": _tags(fm, pm),
            "peers": [],
            "simulation": {
                "baseMarketRate": round(min(30, max(0, growth_rate))),
                "baseTrend": round(100 + min(50, max(-20, momentum6m))),
                "dataYear": current_year,
                "revenueGrowthRate": round(growth_rate, 1),
                "momentum6m": round(momentum6m, 1),
            },
            "priceHistory": _price_history(prices),
        }
    finally:
        dart.close()
        kis.close()


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
