// src/services/company.service.ts

import { Company } from "@prisma/client";
import { CompanyRepository } from "./company.repository";
import { mapToFrontend, mapToDetail, pickClosestByGrowthPattern } from "./company.mapper";
import type {
  CompanyDetailResponse,
  CompanyCompareResponse,
  CompanyFrontendResponse,
  PaginatedCompaniesResponse,
  SearchCompanyRequest,
  GetSimilarRequest,
} from "./company.dto";

// ── Service ───────────────────────────────────────────────────

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  // ── 이름으로 기업 조회 (DB에 저장된 값을 그대로 읽어 응답) ────

  async getByName(name: string): Promise<CompanyFrontendResponse> {
    const company = await this.companyRepository.findDetailByName(name);
    if (!company || (company.financials?.length ?? 0) === 0) {
      throw new Error(`기업을 찾을 수 없어요: ${name}`);
    }

    const hasKnownIndustry = Boolean(company.indutyCode);

    let peers: any[] = hasKnownIndustry
      ? await this.companyRepository.findSimilar({
          corpCode: company.corpCode,
          indutyCode: company.indutyCode as string,
          limit: 4,
        })
      : await this.companyRepository.findGrowthPatternCandidates({
          excludeCorpCode: company.corpCode,
          excludeStockCode: company.stockCode,
          limit: 4,
        });
    peers = pickClosestByGrowthPattern(company, peers, 4);

    // 같은 업종 피어(또는 "기타" 카테고리 후보)가 4개 미만이면
    // 업종 제한 없이 성장 패턴이 가장 비슷한 기업으로 보완
    if (peers.length < 4) {
      const excludeCorpCodes = new Set([
        company.corpCode,
        ...peers.map((p: any) => p.corpCode),
      ]);
      const fillCandidates = await this.companyRepository.findGrowthPatternCandidates({
        excludeCorpCode: company.corpCode,
        excludeStockCode: company.stockCode,
        limit: 4 - peers.length,
      });
      const filtered = fillCandidates.filter((c: any) => !excludeCorpCodes.has(c.corpCode));
      peers = [...peers, ...pickClosestByGrowthPattern(company, filtered, 4 - peers.length)];
    }

    return mapToFrontend(company, peers);
  }

  // ── 기업 상세 조회 ─────────────────────────────────────────────

  async getDetail(corpCode: string): Promise<CompanyDetailResponse> {
    const company = await this.companyRepository.findDetailByCorpCode(corpCode);

    if (!company) {
      throw new Error(`기업을 찾을 수 없습니다: ${corpCode}`);
    }

    return mapToDetail(company);
  }

  // ── 기업 검색 ─────────────────────────────────────────────────

  async search(
    params: SearchCompanyRequest,
  ): Promise<PaginatedCompaniesResponse> {
    const { data: dbData, total } = await this.companyRepository.search(params);

    const mapped = dbData.map((c: Company) => ({
      id: c.id,
      corpCode: c.corpCode,
      corpName: c.corpName,
      stockCode: c.stockCode,
      indutyCode: c.indutyCode,
      indutyName: c.indutyName,
      sector: c.sector,
      market: c.market,
      ceoName: c.ceoName,
    }));

    return {
      data: mapped,
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

    const candidates = await this.companyRepository.findSimilar({
      corpCode: params.corpCode,
      indutyCode: base.indutyCode,
      limit: params.limit,
    });
    const similar = pickClosestByGrowthPattern(base, candidates, params.limit);

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
      companies: companies.map((c) => mapToDetail(c)),

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
}
