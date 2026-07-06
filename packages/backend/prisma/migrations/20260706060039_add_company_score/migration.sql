-- CreateTable
CREATE TABLE "company_scores" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "growth" INTEGER NOT NULL,
    "stability" INTEGER NOT NULL,
    "profitability" INTEGER NOT NULL,
    "momentum" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_scores_companyId_key" ON "company_scores"("companyId");

-- AddForeignKey
ALTER TABLE "company_scores" ADD CONSTRAINT "company_scores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
