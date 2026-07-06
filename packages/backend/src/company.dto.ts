// src/company.dto.ts
//
// 요청/응답 타입 정의. tsoa가 이 타입들을 컴파일 타임에 읽어서
// 런타임 검증 코드 + OpenAPI 스펙을 함께 생성하므로, 검증 로직을
// 별도로 작성하지 않는다 (company.controller.ts의 JSDoc 태그 참고).

// ── Response 타입 ─────────────────────────────────────────────

export interface CompanyResponse {
  id: string;
  corpCode: string;
  corpName: string;
  stockCode: string | null;
  indutyCode: string | null;
  indutyName: string | null;
  sector: string | null;
  market: string | null;
  ceoName: string | null;
}

export interface FinancialSummary {
  year: number;
  reportType: string;
  // 원본 수치 (string으로 직렬화 - BigInt JSON 이슈 방지)
  revenue: string | null;
  operatingProfit: string | null;
  netIncome: string | null;
  totalAssets: string | null;
  totalLiability: string | null;
  totalEquity: string | null;
  // 계산 지표
  revenueGrowthRate: number | null;
  operatingMargin: number | null;
  debtRatio: number | null;
  roe: number | null;
  roa: number | null;
}

export interface StockMetricsSummary {
  calcDate: Date;
  currentPrice: number | null;
  priceChange: number | null;
  volatility20d: number | null;
  volatility60d: number | null;
  momentum1m: number | null;
  momentum3m: number | null;
  momentum6m: number | null;
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  avgVolume20d: string | null; // BigInt → string
}

export interface StockPriceSummary {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string; // BigInt → string
  changeRate: number | null;
}

export interface CompanyDetailResponse extends CompanyResponse {
  latestFinancial: FinancialSummary | null;
  latestMetrics: StockMetricsSummary | null;
  recentPrices: StockPriceSummary[];
}

export interface SimilarCompanyResponse extends CompanyResponse {
  currentPrice: number | null;
  priceChange: number | null;
  operatingMargin: number | null;
  revenueGrowthRate: number | null;
}

export interface SectorAverage {
  avgRevenueGrowth: number | null;
  avgOperatingMargin: number | null;
  avgDebtRatio: number | null;
  avgVolatility: number | null;
}

export interface CompanyCompareResponse {
  companies: CompanyDetailResponse[];
  sectorAverage: SectorAverage | null;
}

export interface PaginatedCompaniesResponse {
  data: CompanyResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── 프론트엔드 호환 응답 타입 ─────────────────────────────────

export interface CompanyFrontendResponse {
  name: string;
  sector: string;
  code: string;
  score: number;
  grade: string;
  axes: {
    growth: number;
    stability: number;
    profitability: number;
    momentum: number;
  };
  why: Array<{
    icon: string;
    title: string;
    // 문장을 segment로 나눠 전달 — tone은 강조할 값의 의미(긍정/주의/부정)만 나타내고,
    // 실제 색상/굵기 등 표현은 프론트엔드가 결정한다.
    segments: Array<{ text: string; tone?: "positive" | "warning" | "negative" }>;
  }>;
  tags: Array<{ label: string; value: string }>;
  peers: Array<{ name: string; correlation: number; score: number }>;
  simulation: {
    baseMarketRate: number;
    baseTrend: number;
    dataYear?: number;
    revenueGrowthRate?: number | null;
    momentum6m?: number | null;
  };
  priceHistory: Array<{ date: string; price: number }>;
}

// ── Request 타입 ───────────────────────────────────────────────

export type MarketType = "코스피" | "코스닥" | "코넥스";

export interface SearchCompanyQuery {
  /**
   * 기업명 또는 종목코드
   * @minLength 1 검색어를 입력해주세요
   * @maxLength 50
   */
  query: string;
  market?: MarketType;
  sector?: string;
  /**
   * @minimum 1
   */
  page?: number;
  /**
   * @minimum 1
   * @maximum 50
   */
  limit?: number;
}

export interface SearchCompanyRequest {
  query: string;
  market?: MarketType;
  sector?: string;
  page: number;
  limit: number;
}

export interface GetSimilarRequest {
  corpCode: string;
  limit: number;
}

export interface CompareCompaniesRequestBody {
  /**
   * 비교할 기업의 corpCode 목록 (2~5개)
   * @minItems 2 최소 2개 기업이 필요합니다
   * @maxItems 5 최대 5개 기업까지 비교 가능합니다
   */
  corpCodes: string[];
}

// ── 공통 응답 래퍼 ─────────────────────────────────────────────

export interface ApiError {
  success: false;
  error: string;
}
