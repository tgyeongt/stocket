from __future__ import annotations

# 재무/가격 지표 → 0~100 점수(축) 변환, 종합 점수·등급·유사도 계산

import math
from typing import Optional


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


def _axes_distance_score(base_axes: dict, peer_axes: dict) -> int:
    """성장·모멘텀 축 거리 기반 유사도(50~98). 같은 업종 후보 안에서
    성장 패턴이 비슷할수록 높은 점수를 줘 버블 차트 중심에 가깝게 표시한다."""
    dist = math.sqrt(
        (base_axes["growth"] - peer_axes["growth"]) ** 2
        + (base_axes["momentum"] - peer_axes["momentum"]) ** 2
    )
    max_dist = math.sqrt(2) * 100
    return int(round(max(50, 98 - (dist / max_dist) * 48)))


def _grade(score: int) -> str:
    if score >= 85:
        return "성장 잠재력 매우 높음"
    if score >= 70:
        return "성장 잠재력 높음"
    if score >= 50:
        return "성장 잠재력 보통"
    return "성장 잠재력 낮음"
