from datetime import datetime


def default_financial_years() -> list[int]:
    # Node/scoring 어느 쪽도 최신 1개년치 이상은 읽지 않는다 (take: 1 / find_latest).
    # 2개년만 가져오면 매출 성장률(전년 대비) 계산에 필요한 최소 단위를 충족하면서
    # DART 호출 수를 5개년 대비 60% 줄일 수 있다.
    current_year = datetime.now().year
    return list(range(current_year - 2, current_year))