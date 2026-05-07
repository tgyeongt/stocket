import { Prisma, PrismaClient } from "@prisma/client";

type SectorAverageResult = {
  avg_revenue_growth: number | null;
  avg_operating_margin: number | null;
  avg_debt_ratio: number | null;
  avg_volatility: number | null;
};

export class CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── 단일 조회 ────────────────────────────────────────────────

  findByCorpCode(corpCode: string) {
    return this.prisma.company.findUnique({
      where: {
        corpCode,
      },
    });
  }

  findByCorpCodeOrThrow(corpCode: string) {
    return this.prisma.company.findUniqueOrThrow({
      where: {
        corpCode,
      },
    });
  }

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: {
        id,
      },
    });
  }

  // ── 상세 조회 (재무 + 주가 지표 포함) ────────────────────────

  findDetailByCorpCode(corpCode: string) {
    return this.prisma.company.findUnique({
      where: {
        corpCode,
      },
      include: {
        financials: {
          orderBy: [{ year: "desc" }, { quarter: "desc" }],
          take: 1,
        },
        stockMetrics: {
          orderBy: {
            calcDate: "desc",
          },
          take: 1,
        },
        stockPrices: {
          orderBy: {
            date: "desc",
          },
          take: 90,
        },
      },
    });
  }

  // ── 복수 상세 조회 (비교용) ───────────────────────────────────

  findManyDetailByCorpCodes(corpCodes: string[]) {
    return this.prisma.company.findMany({
      where: {
        corpCode: {
          in: corpCodes,
        },
      },
      include: {
        financials: {
          orderBy: [{ year: "desc" }, { quarter: "desc" }],
          take: 1,
        },
        stockMetrics: {
          orderBy: {
            calcDate: "desc",
          },
          take: 1,
        },
        stockPrices: {
          orderBy: {
            date: "desc",
          },
          take: 90,
        },
      },
    });
  }

  // ── 검색 ─────────────────────────────────────────────────────

  async search(params: {
    query: string;
    market?: string;
    sector?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.CompanyWhereInput = {
      AND: [
        {
          OR: [
            {
              corpName: {
                contains: params.query,
                mode: "insensitive",
              },
            },
            {
              stockCode: {
                contains: params.query,
              },
            },
          ],
        },
        ...(params.market ? [{ market: params.market }] : []),
        ...(params.sector ? [{ sector: params.sector }] : []),
        {
          stockCode: {
            not: null,
          },
        },
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          corpName: "asc",
        },
      }),
      this.prisma.company.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }

  // ── 유사 기업 조회 ───────────────────────────────────────────

  findSimilar(params: { corpCode: string; indutyCode: string; limit: number }) {
    const prefix = params.indutyCode.slice(0, 2);

    return this.prisma.company.findMany({
      where: {
        corpCode: {
          not: params.corpCode,
        },
        indutyCode: {
          startsWith: prefix,
        },
        stockCode: {
          not: null,
        },
      },
      include: {
        stockMetrics: {
          orderBy: {
            calcDate: "desc",
          },
          take: 1,
        },
        financials: {
          orderBy: [
            {
              year: "desc",
            },
          ],
          take: 1,
        },
      },
      take: params.limit,
    });
  }

  // ── 섹터 평균 지표 조회 ──────────────────────────────────────

  async getSectorAverage(sector: string): Promise<SectorAverageResult | null> {
    const result = await this.prisma.$queryRaw<SectorAverageResult[]>`
      SELECT
        AVG(fs.revenue_growth_rate) AS avg_revenue_growth,
        AVG(fs.operating_margin) AS avg_operating_margin,
        AVG(fs.debt_ratio) AS avg_debt_ratio,
        AVG(sm.volatility20d) AS avg_volatility
      FROM companies c
      LEFT JOIN LATERAL (
        SELECT
          revenue_growth_rate,
          operating_margin,
          debt_ratio
        FROM financial_statements
        WHERE company_id = c.id
        ORDER BY year DESC
        LIMIT 1
      ) fs ON true
      LEFT JOIN LATERAL (
        SELECT
          volatility20d
        FROM stock_metrics
        WHERE company_id = c.id
        ORDER BY calc_date DESC
        LIMIT 1
      ) sm ON true
      WHERE c.sector = ${sector}
        AND c.stock_code IS NOT NULL
    `;

    return result[0] ?? null;
  }

  // ── upsert ───────────────────────────────────────────────────

  upsert(data: Prisma.CompanyUncheckedCreateInput) {
    return this.prisma.company.upsert({
      where: {
        corpCode: data.corpCode,
      },
      create: data,
      update: {
        corpName: data.corpName,
        stockCode: data.stockCode,
        indutyCode: data.indutyCode,
        indutyName: data.indutyName,
        sector: data.sector,
        market: data.market,
        ceoName: data.ceoName,
      },
    });
  }

  // ── 전체 목록 ────────────────────────────────────────────────

  findAllCorpCodes(withStockOnly = true) {
    return this.prisma.company.findMany({
      where: withStockOnly
        ? {
            stockCode: {
              not: null,
            },
          }
        : undefined,
      select: {
        corpCode: true,
        stockCode: true,
      },
    });
  }
}
