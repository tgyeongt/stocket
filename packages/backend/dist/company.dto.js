"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedCompaniesDto = exports.CompanyCompareDto = exports.CompanyDetailDto = exports.StockPriceDto = exports.StockMetricsSummaryDto = exports.FinancialSummaryDto = exports.CompanyDto = exports.CompareCompaniesRequestDto = exports.GetSimilarCompaniesRequestDto = exports.SearchCompanyRequestDto = exports.GetCompanyRequestDto = void 0;
const zod_1 = require("zod");
// ── Request DTOs ──────────────────────────────────────────────
exports.GetCompanyRequestDto = zod_1.z.object({
    corpCode: zod_1.z.string().length(8, "corpCode는 8자리여야 합니다"),
});
exports.SearchCompanyRequestDto = zod_1.z.object({
    query: zod_1.z.string().min(1, "검색어를 입력해주세요").max(50),
    market: zod_1.z.enum(["코스피", "코스닥", "코넥스"]).optional(),
    sector: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
});
exports.GetSimilarCompaniesRequestDto = zod_1.z.object({
    corpCode: zod_1.z.string().length(8),
    limit: zod_1.z.coerce.number().int().min(1).max(10).default(5),
});
exports.CompareCompaniesRequestDto = zod_1.z.object({
    corpCodes: zod_1.z
        .array(zod_1.z.string().length(8))
        .min(2, "최소 2개 기업이 필요합니다")
        .max(5, "최대 5개 기업까지 비교 가능합니다"),
});
// ── Response DTOs ─────────────────────────────────────────────
exports.CompanyDto = zod_1.z.object({
    id: zod_1.z.string(),
    corpCode: zod_1.z.string(),
    corpName: zod_1.z.string(),
    stockCode: zod_1.z.string().nullable(),
    indutyCode: zod_1.z.string().nullable(),
    indutyName: zod_1.z.string().nullable(),
    sector: zod_1.z.string().nullable(),
    market: zod_1.z.string().nullable(),
    ceoName: zod_1.z.string().nullable(),
});
exports.FinancialSummaryDto = zod_1.z.object({
    year: zod_1.z.number(),
    reportType: zod_1.z.string(),
    // 원본 수치 (string으로 직렬화 - BigInt JSON 이슈 방지)
    revenue: zod_1.z.string().nullable(),
    operatingProfit: zod_1.z.string().nullable(),
    netIncome: zod_1.z.string().nullable(),
    totalAssets: zod_1.z.string().nullable(),
    totalLiability: zod_1.z.string().nullable(),
    totalEquity: zod_1.z.string().nullable(),
    // 계산 지표
    revenueGrowthRate: zod_1.z.number().nullable(),
    operatingMargin: zod_1.z.number().nullable(),
    debtRatio: zod_1.z.number().nullable(),
    roe: zod_1.z.number().nullable(),
    roa: zod_1.z.number().nullable(),
});
exports.StockMetricsSummaryDto = zod_1.z.object({
    calcDate: zod_1.z.date(),
    currentPrice: zod_1.z.number().nullable(),
    priceChange: zod_1.z.number().nullable(),
    volatility20d: zod_1.z.number().nullable(),
    volatility60d: zod_1.z.number().nullable(),
    momentum1m: zod_1.z.number().nullable(),
    momentum3m: zod_1.z.number().nullable(),
    momentum6m: zod_1.z.number().nullable(),
    ma20: zod_1.z.number().nullable(),
    ma60: zod_1.z.number().nullable(),
    ma120: zod_1.z.number().nullable(),
    avgVolume20d: zod_1.z.string().nullable(), // BigInt → string
});
exports.StockPriceDto = zod_1.z.object({
    date: zod_1.z.date(),
    open: zod_1.z.number(),
    high: zod_1.z.number(),
    low: zod_1.z.number(),
    close: zod_1.z.number(),
    volume: zod_1.z.string(), // BigInt → string
    changeRate: zod_1.z.number().nullable(),
});
exports.CompanyDetailDto = exports.CompanyDto.extend({
    latestFinancial: exports.FinancialSummaryDto.nullable(),
    latestMetrics: exports.StockMetricsSummaryDto.nullable(),
    recentPrices: zod_1.z.array(exports.StockPriceDto),
});
exports.CompanyCompareDto = zod_1.z.object({
    companies: zod_1.z.array(exports.CompanyDetailDto),
    sectorAverage: zod_1.z
        .object({
        avgRevenueGrowth: zod_1.z.number().nullable(),
        avgOperatingMargin: zod_1.z.number().nullable(),
        avgDebtRatio: zod_1.z.number().nullable(),
        avgVolatility: zod_1.z.number().nullable(),
    })
        .nullable(),
});
exports.PaginatedCompaniesDto = zod_1.z.object({
    data: zod_1.z.array(exports.CompanyDto),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    limit: zod_1.z.number(),
    totalPages: zod_1.z.number(),
});
