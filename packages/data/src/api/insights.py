from __future__ import annotations

# 재무/가격 지표를 사용자에게 보여줄 Why 카드·태그 문구로 변환


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
