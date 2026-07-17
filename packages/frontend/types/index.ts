// CompanyData는 backend의 CompanyFrontendResponse DTO를 그대로 재사용한다
// (프론트/백엔드에서 손으로 복사한 두 벌의 동일한 타입을 두지 않기 위함).
import type { CompanyFrontendResponse } from "@backend/company.dto";

export type CompanyData = CompanyFrontendResponse;
export type AxisScores = CompanyData["axes"];
export type WhyCard = CompanyData["why"][number];
export type WhySegment = WhyCard["segments"][number];
export type FinTag = CompanyData["tags"][number];
export type Peer = CompanyData["peers"][number];
export type PricePoint = CompanyData["priceHistory"][number];

export interface SimulationResult {
  year1: number;
  year3: number;
  year5: number;
  chartData: number[];
}
