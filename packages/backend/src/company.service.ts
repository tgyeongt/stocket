// src/services/company.service.ts

import { Company } from "@prisma/client";
import { CompanyRepository } from "./company.repository";
import type {
  CompanyDetailResponse,
  CompanyCompareResponse,
  CompanyFrontendResponse,
  PaginatedCompaniesResponse,
  SearchCompanyRequest,
  GetSimilarRequest,
} from "./company.dto";

// BigInt → string 직렬화 헬퍼
const bigintToStr = (v: bigint | number | null | undefined): string | null =>
  v != null ? v.toString() : null;

// 0–100 범위로 클램프
const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

// ── 성장성 점수 계산 헬퍼 ─────────────────────────────────────

function calcGrowth(revenueGrowthRate: number | null): number {
  if (revenueGrowthRate == null) return 50;
  return clamp(50 + revenueGrowthRate * 2);
}

function calcStability(debtRatio: number | null): number {
  if (debtRatio == null) return 50;
  // 부채비율이 낮을수록 높은 점수
  if (debtRatio <= 30) return 90;
  if (debtRatio <= 80) return clamp(90 - ((debtRatio - 30) / 50) * 20);
  if (debtRatio <= 150) return clamp(70 - ((debtRatio - 80) / 70) * 20);
  if (debtRatio <= 300) return clamp(50 - ((debtRatio - 150) / 150) * 25);
  return clamp(25 - ((debtRatio - 300) / 200) * 20);
}

function calcProfitability(
  roe: number | null,
  operatingMargin: number | null,
): number {
  const roeScore = roe != null ? clamp(50 + roe * 2.5) : 50;
  const marginScore = operatingMargin != null ? clamp(50 + operatingMargin * 2) : 50;
  return clamp((roeScore + marginScore) / 2);
}

function calcMomentum(
  m1: number | null,
  m3: number | null,
  m6: number | null,
): number {
  const s1 = m1 != null ? clamp(50 + m1 * 3) : 50;
  const s3 = m3 != null ? clamp(50 + m3 * 1.5) : 50;
  const s6 = m6 != null ? clamp(50 + m6 * 0.8) : 50;
  return clamp(s1 * 0.5 + s3 * 0.3 + s6 * 0.2);
}

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

function calcOverallScore(axes: CompanyFrontendResponse["axes"]): number {
  return clamp(
    axes.growth * 0.35 +
    axes.stability * 0.25 +
    axes.profitability * 0.25 +
    axes.momentum * 0.15,
  );
}

function toGrade(score: number): string {
  if (score >= 85) return "성장 잠재력 매우 높음";
  if (score >= 75) return "성장 잠재력 높음";
  if (score >= 60) return "성장 잠재력 보통";
  if (score >= 45) return "성장 잠재력 낮음";
  return "성장 잠재력 매우 낮음";
}

// ── Why 카드 생성 ─────────────────────────────────────────────

function generateWhyCards(
  financial: any,
  metrics: any,
): CompanyFrontendResponse["why"] {
  const cards: CompanyFrontendResponse["why"] = [];
  const g = (v: number) => `<strong class="text-green-400">${v >= 0 ? "+" : ""}${v.toFixed(1)}%</strong>`;
  const y = (v: number) => `<strong class="text-yellow-400">${v >= 0 ? "+" : ""}${v.toFixed(1)}%</strong>`;
  const r = (v: number) => `<strong class="text-red-400">${v >= 0 ? "+" : ""}${v.toFixed(1)}%</strong>`;

  // ── 매출 성장률 ──
  if (financial?.revenueGrowthRate != null) {
    const rate = financial.revenueGrowthRate;
    if (rate >= 15) {
      cards.push({ icon: "📈", title: "매출이 빠르게 성장하고 있어요", body: `매출 성장률이 ${g(rate)}로, 업계 평균을 크게 웃도는 강한 성장세예요.` });
    } else if (rate >= 5) {
      cards.push({ icon: "📊", title: "매출이 꾸준히 성장하고 있어요", body: `매출이 ${g(rate)} 성장하며 안정적인 성장 흐름을 이어가고 있어요.` });
    } else if (rate >= 0) {
      cards.push({ icon: "📉", title: "매출 성장이 정체되고 있어요", body: `매출 성장률이 ${y(rate)}로 낮아, 새로운 성장 동력이 필요한 시점이에요.` });
    } else {
      cards.push({ icon: "⚠️", title: "매출이 감소하고 있어요", body: `매출이 ${r(rate)} 줄었어요. 시장 수요나 경쟁 환경 변화를 주목할 필요가 있어요.` });
    }
  }

  // ── 부채비율 ──
  if (financial?.debtRatio != null) {
    const debt = financial.debtRatio;
    if (debt <= 60) {
      cards.push({ icon: "🛡️", title: "재무 구조가 매우 탄탄해요", body: `부채비율이 <strong class="text-green-400">${debt.toFixed(1)}%</strong>로 낮아, 재무 건전성이 우수해요.` });
    } else if (debt <= 150) {
      cards.push({ icon: "📋", title: "재무 구조는 무난한 편이에요", body: `부채비율이 <strong class="text-yellow-400">${debt.toFixed(1)}%</strong>로 업종 평균 수준이에요.` });
    } else {
      cards.push({ icon: "⚠️", title: "부채 부담이 높은 편이에요", body: `부채비율이 <strong class="text-red-400">${debt.toFixed(1)}%</strong>로 높아, 금리 환경 변화에 취약할 수 있어요.` });
    }
  }

  // ── ROE (자본 효율) ──
  if (financial?.roe != null) {
    const roe = financial.roe;
    if (roe >= 15) {
      cards.push({ icon: "💪", title: "자본 효율이 매우 높아요", body: `ROE가 <strong class="text-green-400">${roe.toFixed(1)}%</strong>로, 투자한 자본 대비 수익 창출 능력이 탁월해요.` });
    } else if (roe >= 8) {
      cards.push({ icon: "💡", title: "자본 효율이 양호해요", body: `ROE가 <strong class="text-green-400">${roe.toFixed(1)}%</strong>로 안정적인 수익을 내고 있어요.` });
    } else if (roe >= 0) {
      cards.push({ icon: "📉", title: "자본 효율이 낮아요", body: `ROE가 <strong class="text-yellow-400">${roe.toFixed(1)}%</strong>로, 자본 활용 효율 개선이 필요해요.` });
    } else {
      cards.push({ icon: "⚠️", title: "자본이 손실을 내고 있어요", body: `ROE가 <strong class="text-red-400">${roe.toFixed(1)}%</strong>로 마이너스예요. 수익성 회복이 중요한 과제예요.` });
    }
  }

  // ── 주가 모멘텀 ──
  if (metrics?.momentum1m != null) {
    const m1 = metrics.momentum1m;
    const ma20 = metrics.ma20;
    const ma60 = metrics.ma60;
    if (m1 >= 10) {
      cards.push({ icon: "🚀", title: "주가 상승 모멘텀이 강해요", body: `최근 한 달 수익률이 ${g(m1)}로, 시장의 강한 기대를 받고 있어요.` });
    } else if (m1 >= 0) {
      if (ma20 != null && ma60 != null && ma20 > ma60) {
        cards.push({ icon: "📊", title: "주가가 상승 추세예요", body: `20일 이동평균이 60일 이동평균 위에 위치하며 상승 흐름을 유지하고 있어요.` });
      } else {
        cards.push({ icon: "📊", title: "주가가 보합세를 유지해요", body: `최근 한 달 수익률이 ${y(m1)}로, 횡보 구간에서 방향성을 탐색 중이에요.` });
      }
    } else if (m1 >= -10) {
      cards.push({ icon: "📉", title: "주가가 조정을 받고 있어요", body: `최근 한 달 수익률이 ${y(m1)}로, 단기 조정 구간에 있어요.` });
    } else {
      cards.push({ icon: "⚠️", title: "주가가 큰 폭으로 하락했어요", body: `최근 한 달 수익률이 ${r(m1)}로, 시장 신뢰 회복이 필요한 상황이에요.` });
    }
  }

  // 최소 2개 보장
  if (cards.length < 2) {
    cards.push({
      icon: "🔍",
      title: "데이터를 분석하고 있어요",
      body: "더 많은 재무 데이터가 수집되면 상세한 분석을 제공할 수 있어요.",
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

function mapToFrontend(company: any, peers: any[]): CompanyFrontendResponse {
  const f = company.financials?.[0] ?? null;
  const m = company.stockMetrics?.[0] ?? null;
  const prices = company.stockPrices ?? [];

  const axes = {
    growth: calcGrowth(f?.revenueGrowthRate ?? null),
    stability: calcStability(f?.debtRatio ?? null),
    profitability: calcProfitability(f?.roe ?? null, f?.operatingMargin ?? null),
    momentum: calcMomentum(
      m?.momentum1m ?? null,
      m?.momentum3m ?? null,
      m?.momentum6m ?? null,
    ),
  };
  const score = calcOverallScore(axes);

  const peerList = peers.map((p) => {
    const pf = p.financials?.[0] ?? null;
    const pm = p.stockMetrics?.[0] ?? null;
    const pAxes = {
      growth: calcGrowth(pf?.revenueGrowthRate ?? null),
      stability: calcStability(pf?.debtRatio ?? null),
      profitability: calcProfitability(pf?.roe ?? null, pf?.operatingMargin ?? null),
      momentum: calcMomentum(pm?.momentum1m ?? null, pm?.momentum3m ?? null, pm?.momentum6m ?? null),
    };
    return {
      name: p.corpName as string,
      correlation: estimateCorrelation(company.indutyCode, p.indutyCode),
      score: calcOverallScore(pAxes),
    };
  });

  const growthRate = f?.revenueGrowthRate ?? 7;
  const momentum6m = m?.momentum6m ?? 0;
  const dataYear = f?.year ?? (new Date().getFullYear() - 1);

  return {
    name: company.corpName,
    sector: resolveIndustryName(company.indutyCode, company.indutyName, company.sector),
    code: company.stockCode ?? "",
    score,
    grade: toGrade(score),
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

const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL ?? "http://localhost:8000";

// 주요 5개 기업 corp_code (피어 보완용)
const MAIN_CORP_CODES = [
  "00126380", // 삼성전자
  "00164779", // SK하이닉스
  "00266961", // NAVER
  "00258801", // 카카오
  "01515323", // LG에너지솔루션
];

// ── Service ───────────────────────────────────────────────────

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  // ── 이름으로 기업 조회 (DB 우선 → Python 서비스 폴백) ─────────

  async getByName(name: string): Promise<CompanyFrontendResponse> {
    // 1. DB에서 먼저 검색 (주요 기업은 DB에 사전 저장)
    const company = await this.companyRepository.findDetailByName(name);
    if (company && (company.financials?.length ?? 0) > 0) {
      let peers: any[] = [];
      if (company.indutyCode) {
        peers = await this.companyRepository.findSimilar({
          corpCode: company.corpCode,
          indutyCode: company.indutyCode,
          limit: 4,
        });
      }

      // 4개 미만이면 Python 섹터 피어로 보완 (같은 섹터 우선)
      if (peers.length < 4 && company.indutyCode) {
        const prefix = company.indutyCode.slice(0, 2);
        const excludeStockCodes = [
          company.stockCode ?? "",
          ...peers.map((p: any) => p.stockCode ?? ""),
        ].filter(Boolean).join(",");

        const pyRes = await fetch(
          `${DATA_SERVICE_URL}/company/sector-peers?prefix=${prefix}&excludes=${encodeURIComponent(excludeStockCodes)}&limit=${4 - peers.length}`,
        ).catch(() => null);

        if (pyRes?.ok) {
          const pyBody = (await pyRes.json()) as { data: Array<{ name: string; score: number; correlation: number }> };
          // Python 피어는 이미 {name, score, correlation} 형태이므로 직접 병합
          const result = mapToFrontend(company, peers);
          result.peers = [
            ...result.peers,
            ...(pyBody.data ?? []).slice(0, 4 - result.peers.length),
          ];
          return result;
        }
      }

      return mapToFrontend(company, peers);
    }

    // 2. DB에 없으면 Python 데이터 서비스에 실시간 조회 위임
    const res = await fetch(
      `${DATA_SERVICE_URL}/company?name=${encodeURIComponent(name)}`,
    ).catch(() => null);

    if (res?.ok) {
      const pyData = (await res.json()) as CompanyFrontendResponse;

      // peers가 부족하면 주요 기업 중에서 보완
      if (pyData.peers.length < 2) {
        const needed = 2 - pyData.peers.length;
        const fallbackCodes = MAIN_CORP_CODES.slice(0, needed + 1); // 여유분 포함
        const extras = await this.companyRepository.findManyDetailByCorpCodes(fallbackCodes);
        const extraPeers = extras.slice(0, needed).map((p: any) => {
          const pf = p.financials?.[0] ?? null;
          const pm = p.stockMetrics?.[0] ?? null;
          const pAxes = {
            growth: calcGrowth(pf?.revenueGrowthRate ?? null),
            stability: calcStability(pf?.debtRatio ?? null),
            profitability: calcProfitability(pf?.roe ?? null, pf?.operatingMargin ?? null),
            momentum: calcMomentum(pm?.momentum1m ?? null, pm?.momentum3m ?? null, pm?.momentum6m ?? null),
          };
          return {
            name: p.corpName as string,
            correlation: 68,
            score: calcOverallScore(pAxes),
          };
        });
        pyData.peers = [...pyData.peers, ...extraPeers];
      }

      return pyData;
    }

    throw new Error(`기업을 찾을 수 없어요: ${name}`);
  }

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
    const { data: dbData, total: dbTotal } = await this.companyRepository.search(params);

    const dbStockCodes = new Set(
      dbData.map((c: Company) => c.stockCode).filter(Boolean)
    );
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

    // Python DART 기업 목록으로 DB 미등록 기업 보완
    if (mapped.length < params.limit) {
      const pyRes = await fetch(
        `${DATA_SERVICE_URL}/company/search?name=${encodeURIComponent(params.query)}`,
      ).catch(() => null);
      if (pyRes?.ok) {
        const pyBody = (await pyRes.json()) as { data: { corpName: string; stockCode: string }[] };
        const extras = (pyBody.data ?? [])
          .filter((c) => !dbStockCodes.has(c.stockCode ?? ""))
          .slice(0, params.limit - mapped.length)
          .map((c) => ({
            id: "",
            corpCode: "",
            corpName: c.corpName,
            stockCode: c.stockCode,
            indutyCode: null,
            indutyName: null,
            sector: null,
            market: null,
            ceoName: null,
          }));
        mapped.push(...extras);
      }
    }

    const total = mapped.length < params.limit ? mapped.length : Math.max(dbTotal, mapped.length);
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
