from datetime import datetime


def default_financial_years() -> list[int]:
    current_year = datetime.now().year
    return list(range(current_year - 5, current_year))