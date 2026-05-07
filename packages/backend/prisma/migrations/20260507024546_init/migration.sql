-- CreateEnum
CREATE TYPE "FetchDataType" AS ENUM ('COMPANY_INFO', 'FINANCIAL_STATEMENT', 'STOCK_PRICE', 'STOCK_METRICS');

-- CreateEnum
CREATE TYPE "FetchStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "corpCode" TEXT NOT NULL,
    "corpName" TEXT NOT NULL,
    "stockCode" TEXT,
    "indutyCode" TEXT,
    "indutyName" TEXT,
    "sector" TEXT,
    "market" TEXT,
    "ceoName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_statements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "reportType" TEXT NOT NULL,
    "revenue" BIGINT,
    "operatingProfit" BIGINT,
    "netIncome" BIGINT,
    "totalAssets" BIGINT,
    "totalLiability" BIGINT,
    "totalEquity" BIGINT,
    "revenueGrowthRate" DOUBLE PRECISION,
    "operatingMargin" DOUBLE PRECISION,
    "debtRatio" DOUBLE PRECISION,
    "roe" DOUBLE PRECISION,
    "roa" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_prices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" INTEGER NOT NULL,
    "high" INTEGER NOT NULL,
    "low" INTEGER NOT NULL,
    "close" INTEGER NOT NULL,
    "volume" BIGINT NOT NULL,
    "changeRate" DOUBLE PRECISION,

    CONSTRAINT "stock_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "calcDate" DATE NOT NULL,
    "currentPrice" INTEGER,
    "priceChange" DOUBLE PRECISION,
    "volatility20d" DOUBLE PRECISION,
    "volatility60d" DOUBLE PRECISION,
    "momentum1m" DOUBLE PRECISION,
    "momentum3m" DOUBLE PRECISION,
    "momentum6m" DOUBLE PRECISION,
    "ma20" DOUBLE PRECISION,
    "ma60" DOUBLE PRECISION,
    "ma120" DOUBLE PRECISION,
    "avgVolume20d" BIGINT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_logs" (
    "id" TEXT NOT NULL,
    "corpCode" TEXT NOT NULL,
    "dataType" "FetchDataType" NOT NULL,
    "status" "FetchStatus" NOT NULL,
    "message" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fetch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_corpCode_key" ON "companies"("corpCode");

-- CreateIndex
CREATE UNIQUE INDEX "companies_stockCode_key" ON "companies"("stockCode");

-- CreateIndex
CREATE INDEX "companies_indutyCode_idx" ON "companies"("indutyCode");

-- CreateIndex
CREATE INDEX "companies_sector_idx" ON "companies"("sector");

-- CreateIndex
CREATE INDEX "financial_statements_companyId_year_idx" ON "financial_statements"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "financial_statements_companyId_year_quarter_reportType_key" ON "financial_statements"("companyId", "year", "quarter", "reportType");

-- CreateIndex
CREATE INDEX "stock_prices_companyId_date_idx" ON "stock_prices"("companyId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "stock_prices_companyId_date_key" ON "stock_prices"("companyId", "date");

-- CreateIndex
CREATE INDEX "stock_metrics_companyId_calcDate_idx" ON "stock_metrics"("companyId", "calcDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "stock_metrics_companyId_calcDate_key" ON "stock_metrics"("companyId", "calcDate");

-- CreateIndex
CREATE INDEX "fetch_logs_corpCode_dataType_idx" ON "fetch_logs"("corpCode", "dataType");

-- AddForeignKey
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_prices" ADD CONSTRAINT "stock_prices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_metrics" ADD CONSTRAINT "stock_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
