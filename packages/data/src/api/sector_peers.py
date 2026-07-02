from __future__ import annotations

# DART 기업 목록 캐시, 기업명/종목코드 검색, 섹터별 큐레이션 피어와
# 그 점수 캐시(백그라운드 사전 계산) 관리

import threading
import time
from datetime import date
from typing import Optional

from src.clients.dart_client import DartClient
from src.utils.logger import get_logger

from .financial_metrics import _calc_financial_metrics, _parse_financials
from .scoring import _calc_growth, _calc_profitability, _calc_stability, _overall

logger = get_logger(__name__)

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
        return {"name": corp_name, "score": _overall(axes), "correlation": 72, "axes": axes}
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
