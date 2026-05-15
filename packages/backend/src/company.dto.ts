import { z } from "zod";

// ── Request DTOs ──────────────────────────────────────────────

export const GetCompanyRequestDto = z.object({
  corpCode: z.string().length(8, "corpCode는 8자리여야 합니다"),
});

export const SearchCompanyRequestDto = z.object({
  query: z.string().min(1, "검색어를 입력해주세요").max(50),
  market: z.enum(["코스피", "코스닥", "코넥스"]).optional(),
  sector: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GetSimilarCompaniesRequestDto = z.object({
  corpCode: z.string().length(8),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const CompareCompaniesRequestDto = z.object({
  corpCodes: z
    .array(z.string().length(8))
    .min(2, "최소 2개 기업이 필요합니다")
    .max(5, "최대 5개 기업까지 비교 가능합니다"),
});

// ── Response DTOs ─────────────────────────────────────────────

export const CompanyDto = z.object({
  id: z.string(),
  corpCode: z.string(),
  corpName: z.string(),
  stockCode: z.string().nullable(),
  indutyCode: z.string().nullable(),
  indutyName: z.string().nullable(),
  sector: z.string().nullable(),
  market: z.string().nullable(),
  ceoName: z.string().nullable(),
});

export const FinancialSummaryDto = z.object({
  year: z.number(),
  reportType: z.string(),
  // 원본 수치 (string으로 직렬화 - BigInt JSON 이슈 방지)
  revenue: z.string().nullable(),
  operatingProfit: z.string().nullable(),
  netIncome: z.string().nullable(),
  totalAssets: z.string().nullable(),
  totalLiability: z.string().nullable(),
  totalEquity: z.string().nullable(),
  // 계산 지표
  revenueGrowthRate: z.number().nullable(),
  operatingMargin: z.number().nullable(),
  debtRatio: z.number().nullable(),
  roe: z.number().nullable(),
  roa: z.number().nullable(),
});

export const StockMetricsSummaryDto = z.object({
  calcDate: z.date(),
  currentPrice: z.number().nullable(),
  priceChange: z.number().nullable(),
  volatility20d: z.number().nullable(),
  volatility60d: z.number().nullable(),
  momentum1m: z.number().nullable(),
  momentum3m: z.number().nullable(),
  momentum6m: z.number().nullable(),
  ma20: z.number().nullable(),
  ma60: z.number().nullable(),
  ma120: z.number().nullable(),
  avgVolume20d: z.string().nullable(), // BigInt → string
});

export const StockPriceDto = z.object({
  date: z.date(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.string(), // BigInt → string
  changeRate: z.number().nullable(),
});

export const CompanyDetailDto = CompanyDto.extend({
  latestFinancial: FinancialSummaryDto.nullable(),
  latestMetrics: StockMetricsSummaryDto.nullable(),
  recentPrices: z.array(StockPriceDto),
});

export const CompanyCompareDto = z.object({
  companies: z.array(CompanyDetailDto),
  sectorAverage: z
    .object({
      avgRevenueGrowth: z.number().nullable(),
      avgOperatingMargin: z.number().nullable(),
      avgDebtRatio: z.number().nullable(),
      avgVolatility: z.number().nullable(),
    })
    .nullable(),
});

export const PaginatedCompaniesDto = z.object({
  data: z.array(CompanyDto),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

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
  why: Array<{ icon: string; title: string; body: string }>;
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

// ── 타입 추출 ─────────────────────────────────────────────────

export type GetCompanyRequest = z.infer<typeof GetCompanyRequestDto>;
export type SearchCompanyRequest = z.infer<typeof SearchCompanyRequestDto>;
export type GetSimilarRequest = z.infer<typeof GetSimilarCompaniesRequestDto>;
export type CompareCompaniesRequest = z.infer<
  typeof CompareCompaniesRequestDto
>;
export type CompanyResponse = z.infer<typeof CompanyDto>;
export type CompanyDetailResponse = z.infer<typeof CompanyDetailDto>;
export type CompanyCompareResponse = z.infer<typeof CompanyCompareDto>;
export type PaginatedCompaniesResponse = z.infer<typeof PaginatedCompaniesDto>;
