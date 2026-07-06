from __future__ import annotations

# src/services/scoring_service.py
#
# 저장된 최신 재무 비율(FinancialStatement) + 최신 주가 지표(StockMetrics)를 바탕으로
# growth/stability/profitability/momentum/overall 점수를 pandas로 벡터화 계산하고
# company_scores 테이블에 저장한다.

import pandas as pd
from sqlalchemy.orm import Session

from src.repositories.company_repository import CompanyRepository
from src.repositories.company_score_repository import CompanyScoreRepository
from src.repositories.financial_repository import FinancialRepository
from src.repositories.stock_repository import StockRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)

_AXIS_COLUMNS = ["growth", "stability", "profitability", "momentum"]


def _clamp(series: pd.Series) -> pd.Series:
    return series.round().clip(lower=0, upper=100)


def _calc_growth(df: pd.DataFrame) -> pd.Series:
    return _clamp(50 + df["revenue_growth_rate"].fillna(0) * 2)


def _calc_stability(df: pd.DataFrame) -> pd.Series:
    debt = df["debt_ratio"]
    score = pd.Series(50.0, index=df.index)

    has_debt = debt.notna()
    score.loc[has_debt & (debt <= 30)] = 90
    score.loc[has_debt & (debt > 30) & (debt <= 80)] = 90 - (debt - 30) / 50 * 20
    score.loc[has_debt & (debt > 80) & (debt <= 150)] = 70 - (debt - 80) / 70 * 20
    score.loc[has_debt & (debt > 150) & (debt <= 300)] = 50 - (debt - 150) / 150 * 25
    score.loc[has_debt & (debt > 300)] = 25 - (debt - 300) / 200 * 20

    return _clamp(score)


def _calc_profitability(df: pd.DataFrame) -> pd.Series:
    roe_score = _clamp(50 + df["roe"].fillna(0) * 2.5)
    margin_score = _clamp(50 + df["operating_margin"].fillna(0) * 2)
    return _clamp((roe_score + margin_score) / 2)


def _calc_momentum(df: pd.DataFrame) -> pd.Series:
    s1 = _clamp(50 + df["momentum1m"].fillna(0) * 3)
    s3 = _clamp(50 + df["momentum3m"].fillna(0) * 1.5)
    s6 = _clamp(50 + df["momentum6m"].fillna(0) * 0.8)
    return _clamp(s1 * 0.5 + s3 * 0.3 + s6 * 0.2)


def _calc_overall(df: pd.DataFrame) -> pd.Series:
    return _clamp(
        df["growth"] * 0.35
        + df["stability"] * 0.25
        + df["profitability"] * 0.25
        + df["momentum"] * 0.15
    )


def _calc_grade(overall: pd.Series) -> pd.Series:
    grade = pd.Series("성장 잠재력 매우 낮음", index=overall.index)
    grade.loc[overall >= 45] = "성장 잠재력 낮음"
    grade.loc[overall >= 60] = "성장 잠재력 보통"
    grade.loc[overall >= 75] = "성장 잠재력 높음"
    grade.loc[overall >= 85] = "성장 잠재력 매우 높음"
    return grade


class ScoringService:
    def __init__(self, session: Session) -> None:
        self._s = session
        self._company_repo = CompanyRepository(session)
        self._financial_repo = FinancialRepository(session)
        self._stock_repo = StockRepository(session)
        self._score_repo = CompanyScoreRepository(session)

    def recalculate(self, corp_codes: list[str]) -> dict:
        rows: list[dict] = []
        for corp_code in corp_codes:
            company = self._company_repo.find_by_corp_code(corp_code)
            if not company:
                continue

            fin = self._financial_repo.find_latest(company.id)
            metrics = self._stock_repo.find_latest_metrics(company.id)
            if fin is None and metrics is None:
                continue

            rows.append({
                "company_id": company.id,
                "revenue_growth_rate": fin.revenueGrowthRate if fin else None,
                "operating_margin": fin.operatingMargin if fin else None,
                "debt_ratio": fin.debtRatio if fin else None,
                "roe": fin.roe if fin else None,
                "momentum1m": metrics.momentum1m if metrics else None,
                "momentum3m": metrics.momentum3m if metrics else None,
                "momentum6m": metrics.momentum6m if metrics else None,
            })

        if not rows:
            return {"scored": 0}

        df = pd.DataFrame(rows)
        df["growth"] = _calc_growth(df)
        df["stability"] = _calc_stability(df)
        df["profitability"] = _calc_profitability(df)
        df["momentum"] = _calc_momentum(df)
        df["overall"] = _calc_overall(df)
        df["grade"] = _calc_grade(df["overall"])

        for _, row in df.iterrows():
            self._score_repo.upsert({
                "company_id": row["company_id"],
                "growth": int(row["growth"]),
                "stability": int(row["stability"]),
                "profitability": int(row["profitability"]),
                "momentum": int(row["momentum"]),
                "overall": int(row["overall"]),
                "grade": row["grade"],
            })

        self._s.commit()
        logger.info(f"점수 계산 완료: {len(df)}개 기업")
        return {"scored": len(df)}
