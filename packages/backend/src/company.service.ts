// src/services/company.service.ts

import { Company } from "@prisma/client";
import { CompanyRepository } from "./company.repository";
import type {
  CompanyDetailResponse,
  CompanyCompareResponse,
  PaginatedCompaniesResponse,
  SearchCompanyRequest,
  GetSimilarRequest,
} from "./company.dto";

// BigInt → string 직렬화 헬퍼
const bigintToStr = (v: bigint | number | null | undefined): string | null =>
  v != null ? v.toString() : null;

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  // ── 기업 상세 조회 ─────────────────────────────────────────────

  async getDetail(corpCode: string): Promise<CompanyDetailResponse> {
    const company = await this.companyRepository.findDetailByCorpCode(corpCode);

    if (!company) {
      throw new Error(`기업을 찾을 수 없습니다: ${corpCode}`);
    }

    return this.mapToDetail(company);
  }

  // ── 기업 검색 ─────────────────────────────────────────────────

  async search(
    params: SearchCompanyRequest,
  ): Promise<PaginatedCompaniesResponse> {
    const { data, total } = await this.companyRepository.search(params);

    return {
      data: data.map((c: Company) => ({
        id: c.id,
        corpCode: c.corpCode,
        corpName: c.corpName,
        stockCode: c.stockCode,
        indutyCode: c.indutyCode,
        indutyName: c.indutyName,
        sector: c.sector,
        market: c.market,
        ceoName: c.ceoName,
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  // ── 유사 기업 탐색 ─────────────────────────────────────────────

  async getSimilar(params: GetSimilarRequest) {
    const base = await this.companyRepository.findByCorpCodeOrThrow(
      params.corpCode,
    );

    if (!base.indutyCode) {
      return [];
    }

    const similar = await this.companyRepository.findSimilar({
      corpCode: params.corpCode,
      indutyCode: base.indutyCode,
      limit: params.limit,
    });

    return similar.map((c) => ({
      id: c.id,
      corpCode: c.corpCode,
      corpName: c.corpName,
      stockCode: c.stockCode,
      indutyCode: c.indutyCode,
      indutyName: c.indutyName,
      sector: c.sector,
      market: c.market,
      ceoName: c.ceoName,

      // 최신 요약 지표
      currentPrice: c.stockMetrics?.[0]?.currentPrice ?? null,
      priceChange: c.stockMetrics?.[0]?.priceChange ?? null,
      operatingMargin: c.financials?.[0]?.operatingMargin ?? null,
      revenueGrowthRate: c.financials?.[0]?.revenueGrowthRate ?? null,
    }));
  }

  // ── 기업 비교 분석 ─────────────────────────────────────────────

  async compare(corpCodes: string[]): Promise<CompanyCompareResponse> {
    const companies =
      await this.companyRepository.findManyDetailByCorpCodes(corpCodes);

    if (companies.length === 0) {
      throw new Error("비교할 기업을 찾을 수 없습니다");
    }

    const sector = companies[0].sector;

    const sectorAverage = sector
      ? await this.companyRepository.getSectorAverage(sector)
      : null;

    return {
      companies: companies.map((c) => this.mapToDetail(c)),

      sectorAverage: sectorAverage
        ? {
            avgRevenueGrowth: Number(sectorAverage.avg_revenue_growth) || null,

            avgOperatingMargin:
              Number(sectorAverage.avg_operating_margin) || null,

            avgDebtRatio: Number(sectorAverage.avg_debt_ratio) || null,

            avgVolatility: Number(sectorAverage.avg_volatility) || null,
          }
        : null,
    };
  }

  // ── Prisma 모델 → DTO 변환 ────────────────────────────────────

  private mapToDetail(company: any): CompanyDetailResponse {
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
}
