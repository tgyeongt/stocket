// src/company.mapper.ts
//
// Prisma 모델 → 프론트엔드 응답 DTO 변환 (순수 함수 모음, DB/네트워크 접근 없음)

import type { CompanyDetailResponse, CompanyFrontendResponse } from "./company.dto";

// BigInt → string 직렬화 헬퍼
export const bigintToStr = (v: bigint | number | null | undefined): string | null =>
  v != null ? v.toString() : null;

// 배치(packages/data)가 아직 점수를 계산하지 못한 회사를 위한 중립값
// (score 계산 로직 자체는 Python 배치 잡의 scoring_service.py가 전담한다)
export const DEFAULT_SCORE = {
  growth: 50,
  stability: 50,
  profitability: 50,
  momentum: 50,
  overall: 50,
  grade: "성장 잠재력 낮음",
};

// 주요 5개 기업 corp_code (피어 수가 부족할 때 보완용)
export const MAIN_CORP_CODES = [
  "00126380", // 삼성전자
  "00164779", // SK하이닉스
  "00266961", // NAVER
  "00258801", // 카카오
  "01515323", // LG에너지솔루션
];

// DART 업종코드 앞 3자리 → 한글 업종명
const INDUSTRY_CODE_MAP: Record<string, string> = {
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
  "631": "소프트웨어",
  "632": "IT서비스",
  "641": "은행",
  "649": "금융",
  "651": "보험",
  "661": "증권",
  "351": "통신서비스",
  "461": "도매",
  "471": "소매",
  "551": "숙박",
  "561": "음식",
};

function resolveIndustryName(indutyCode: string | null, indutyName: string | null, sector: string | null): string {
  if (sector) return sector;
  if (indutyName) return indutyName;
  if (indutyCode) return INDUSTRY_CODE_MAP[indutyCode.slice(0, 3)] ?? "기타";
  return "기타";
}

// ── Why 카드 생성 ─────────────────────────────────────────────
// 색상/굵기 등 스타일은 프론트엔드가 결정한다. 여기서는 문장을 일반 텍스트
// segment와 강조할 수치 segment(tone만 부여)로만 나눠 데이터로 전달한다.

type Tone = "positive" | "warning" | "negative";
type WhySegment = { text: string; tone?: Tone };

function pct(v: number, withSign = true): string {
  const sign = withSign && v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function generateWhyCards(
  financial: any,
  metrics: any,
): CompanyFrontendResponse["why"] {
  const cards: CompanyFrontendResponse["why"] = [];
  const highlight = (text: string, tone: Tone): WhySegment => ({ text, tone });

  // ── 매출 성장률 ──
  if (financial?.revenueGrowthRate != null) {
    const rate = financial.revenueGrowthRate;
    if (rate >= 15) {
      cards.push({ icon: "📈", title: "매출이 빠르게 성장하고 있어요", segments: [
        { text: "매출 성장률이 " }, highlight(pct(rate), "positive"), { text: "로, 업계 평균을 크게 웃도는 강한 성장세예요." },
      ] });
    } else if (rate >= 5) {
      cards.push({ icon: "📊", title: "매출이 꾸준히 성장하고 있어요", segments: [
        { text: "매출이 " }, highlight(pct(rate), "positive"), { text: " 성장하며 안정적인 성장 흐름을 이어가고 있어요." },
      ] });
    } else if (rate >= 0) {
      cards.push({ icon: "📉", title: "매출 성장이 정체되고 있어요", segments: [
        { text: "매출 성장률이 " }, highlight(pct(rate), "warning"), { text: "로 낮아, 새로운 성장 동력이 필요한 시점이에요." },
      ] });
    } else {
      cards.push({ icon: "⚠️", title: "매출이 감소하고 있어요", segments: [
        { text: "매출이 " }, highlight(pct(rate), "negative"), { text: " 줄었어요. 시장 수요나 경쟁 환경 변화를 주목할 필요가 있어요." },
      ] });
    }
  }

  // ── 부채비율 ──
  if (financial?.debtRatio != null) {
    const debt = financial.debtRatio;
    if (debt <= 60) {
      cards.push({ icon: "🛡️", title: "재무 구조가 매우 탄탄해요", segments: [
        { text: "부채비율이 " }, highlight(pct(debt, false), "positive"), { text: "로 낮아, 재무 건전성이 우수해요." },
      ] });
    } else if (debt <= 150) {
      cards.push({ icon: "📋", title: "재무 구조는 무난한 편이에요", segments: [
        { text: "부채비율이 " }, highlight(pct(debt, false), "warning"), { text: "로 업종 평균 수준이에요." },
      ] });
    } else {
      cards.push({ icon: "⚠️", title: "부채 부담이 높은 편이에요", segments: [
        { text: "부채비율이 " }, highlight(pct(debt, false), "negative"), { text: "로 높아, 금리 환경 변화에 취약할 수 있어요." },
      ] });
    }
  }

  // ── ROE (자본 효율) ──
  if (financial?.roe != null) {
    const roe = financial.roe;
    if (roe >= 15) {
      cards.push({ icon: "💪", title: "자본 효율이 매우 높아요", segments: [
        { text: "ROE가 " }, highlight(pct(roe), "positive"), { text: "로, 투자한 자본 대비 수익 창출 능력이 탁월해요." },
      ] });
    } else if (roe >= 8) {
      cards.push({ icon: "💡", title: "자본 효율이 양호해요", segments: [
        { text: "ROE가 " }, highlight(pct(roe), "positive"), { text: "로 안정적인 수익을 내고 있어요." },
      ] });
    } else if (roe >= 0) {
      cards.push({ icon: "📉", title: "자본 효율이 낮아요", segments: [
        { text: "ROE가 " }, highlight(pct(roe), "warning"), { text: "로, 자본 활용 효율 개선이 필요해요." },
      ] });
    } else {
      cards.push({ icon: "⚠️", title: "자본이 손실을 내고 있어요", segments: [
        { text: "ROE가 " }, highlight(pct(roe), "negative"), { text: "로 마이너스예요. 수익성 회복이 중요한 과제예요." },
      ] });
    }
  }

  // ── 주가 모멘텀 ──
  if (metrics?.momentum1m != null) {
    const m1 = metrics.momentum1m;
    const ma20 = metrics.ma20;
    const ma60 = metrics.ma60;
    if (m1 >= 10) {
      cards.push({ icon: "🚀", title: "주가 상승 모멘텀이 강해요", segments: [
        { text: "최근 한 달 수익률이 " }, highlight(pct(m1), "positive"), { text: "로, 시장의 강한 기대를 받고 있어요." },
      ] });
    } else if (m1 >= 0) {
      if (ma20 != null && ma60 != null && ma20 > ma60) {
        cards.push({ icon: "📊", title: "주가가 상승 추세예요", segments: [
          { text: "20일 이동평균이 60일 이동평균 위에 위치하며 상승 흐름을 유지하고 있어요." },
        ] });
      } else {
        cards.push({ icon: "📊", title: "주가가 보합세를 유지해요", segments: [
          { text: "최근 한 달 수익률이 " }, highlight(pct(m1), "warning"), { text: "로, 횡보 구간에서 방향성을 탐색 중이에요." },
        ] });
      }
    } else if (m1 >= -10) {
      cards.push({ icon: "📉", title: "주가가 조정을 받고 있어요", segments: [
        { text: "최근 한 달 수익률이 " }, highlight(pct(m1), "warning"), { text: "로, 단기 조정 구간에 있어요." },
      ] });
    } else {
      cards.push({ icon: "⚠️", title: "주가가 큰 폭으로 하락했어요", segments: [
        { text: "최근 한 달 수익률이 " }, highlight(pct(m1), "negative"), { text: "로, 시장 신뢰 회복이 필요한 상황이에요." },
      ] });
    }
  }

  // 최소 2개 보장
  if (cards.length < 2) {
    cards.push({
      icon: "🔍",
      title: "데이터를 분석하고 있어요",
      segments: [{ text: "더 많은 재무 데이터가 수집되면 상세한 분석을 제공할 수 있어요." }],
    });
  }

  return cards.slice(0, 4);
}

// ── FinTag 생성 ───────────────────────────────────────────────

function generateTags(
  financial: any,
  metrics: any,
): CompanyFrontendResponse["tags"] {
  const tags: CompanyFrontendResponse["tags"] = [];

  if (financial?.roe != null)
    tags.push({ label: "ROE", value: `${financial.roe.toFixed(1)}%` });
  if (financial?.operatingMargin != null)
    tags.push({ label: "영업이익률", value: `${financial.operatingMargin.toFixed(1)}%` });
  if (financial?.debtRatio != null)
    tags.push({ label: "부채비율", value: `${financial.debtRatio.toFixed(1)}%` });
  if (financial?.revenueGrowthRate != null)
    tags.push({
      label: "매출 YoY",
      value: `${financial.revenueGrowthRate >= 0 ? "+" : ""}${financial.revenueGrowthRate.toFixed(1)}%`,
    });
  if (metrics?.momentum1m != null)
    tags.push({
      label: "1M 모멘텀",
      value: `${metrics.momentum1m >= 0 ? "+" : ""}${metrics.momentum1m.toFixed(1)}%`,
    });

  return tags;
}

// ── 12개월 월별 종가 추출 ─────────────────────────────────────

function extractPriceHistory(recentPrices: any[]): { date: string; price: number }[] {
  return [...recentPrices]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-90)
    .map((p) => ({
      date: typeof p.date === "string" ? p.date : p.date.toISOString().slice(0, 10),
      price: p.close,
    }));
}

// ── Peer 유사도 추정 ──────────────────────────────────────────

function estimateCorrelation(baseIndutyCode: string | null, peerIndutyCode: string | null): number {
  if (!baseIndutyCode || !peerIndutyCode) return 70;
  const samePrefix = baseIndutyCode.slice(0, 2) === peerIndutyCode.slice(0, 2);
  return samePrefix ? 85 : 68;
}

// ── Prisma 모델 → CompanyFrontendResponse 변환 ────────────────

export function mapToFrontend(company: any, peers: any[]): CompanyFrontendResponse {
  const f = company.financials?.[0] ?? null;
  const m = company.stockMetrics?.[0] ?? null;
  const prices = company.stockPrices ?? [];
  const score = company.score ?? null;

  const axes = {
    growth: score?.growth ?? DEFAULT_SCORE.growth,
    stability: score?.stability ?? DEFAULT_SCORE.stability,
    profitability: score?.profitability ?? DEFAULT_SCORE.profitability,
    momentum: score?.momentum ?? DEFAULT_SCORE.momentum,
  };

  const peerList = peers.map((p) => ({
    name: p.corpName as string,
    correlation: estimateCorrelation(company.indutyCode, p.indutyCode),
    score: p.score?.overall ?? DEFAULT_SCORE.overall,
  }));

  const growthRate = f?.revenueGrowthRate ?? 7;
  const momentum6m = m?.momentum6m ?? 0;
  const dataYear = f?.year ?? (new Date().getFullYear() - 1);

  return {
    name: company.corpName,
    sector: resolveIndustryName(company.indutyCode, company.indutyName, company.sector),
    code: company.stockCode ?? "",
    score: score?.overall ?? DEFAULT_SCORE.overall,
    grade: score?.grade ?? DEFAULT_SCORE.grade,
    axes,
    why: generateWhyCards(f, m),
    tags: generateTags(f, m),
    peers: peerList,
    simulation: {
      baseMarketRate: Math.round(Math.min(30, Math.max(0, growthRate))),
      baseTrend: Math.round(100 + Math.min(50, Math.max(-20, momentum6m))),
      dataYear,
      revenueGrowthRate: f?.revenueGrowthRate ?? null,
      momentum6m: m?.momentum6m ?? null,
    },
    priceHistory: extractPriceHistory(prices),
  };
}

// ── Prisma 모델 → CompanyDetailResponse 변환 ──────────────────

export function mapToDetail(company: any): CompanyDetailResponse {
  const latestFinancial = company.financials?.[0] ?? null;
  const latestMetrics = company.stockMetrics?.[0] ?? null;
  const recentPrices = company.stockPrices ?? [];

  return {
    id: company.id,
    corpCode: company.corpCode,
    corpName: company.corpName,
    stockCode: company.stockCode,
    indutyCode: company.indutyCode,
    indutyName: company.indutyName,
    sector: company.sector,
    market: company.market,
    ceoName: company.ceoName,

    latestFinancial: latestFinancial
      ? {
          year: latestFinancial.year,
          reportType: latestFinancial.reportType,
          revenue: bigintToStr(latestFinancial.revenue),
          operatingProfit: bigintToStr(latestFinancial.operatingProfit),
          netIncome: bigintToStr(latestFinancial.netIncome),
          totalAssets: bigintToStr(latestFinancial.totalAssets),
          totalLiability: bigintToStr(latestFinancial.totalLiability),
          totalEquity: bigintToStr(latestFinancial.totalEquity),
          revenueGrowthRate: latestFinancial.revenueGrowthRate,
          operatingMargin: latestFinancial.operatingMargin,
          debtRatio: latestFinancial.debtRatio,
          roe: latestFinancial.roe,
          roa: latestFinancial.roa,
        }
      : null,

    latestMetrics: latestMetrics
      ? {
          calcDate: latestMetrics.calcDate,
          currentPrice: latestMetrics.currentPrice,
          priceChange: latestMetrics.priceChange,
          volatility20d: latestMetrics.volatility20d,
          volatility60d: latestMetrics.volatility60d,
          momentum1m: latestMetrics.momentum1m,
          momentum3m: latestMetrics.momentum3m,
          momentum6m: latestMetrics.momentum6m,
          ma20: latestMetrics.ma20,
          ma60: latestMetrics.ma60,
          ma120: latestMetrics.ma120,
          avgVolume20d: bigintToStr(latestMetrics.avgVolume20d),
        }
      : null,

    recentPrices: recentPrices.map((p: any) => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: bigintToStr(p.volume) ?? "0",
      changeRate: p.changeRate,
    })),
  };
}
