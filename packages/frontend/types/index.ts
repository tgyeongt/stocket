export interface AxisScores {
  growth: number;      // 성장성
  stability: number;   // 안정성
  profitability: number; // 수익성
  momentum: number;    // 시장 모멘텀
}

export interface WhyCard {
  icon: string;
  title: string;
  body: string;
}

export interface FinTag {
  label: string;
  value: string;
}

export interface Peer {
  name: string;
  correlation: number;
  score: number;
}

export interface PricePoint {
  date: string;   // YYYY-MM-DD
  price: number;
}

export interface CompanyData {
  name: string;
  sector: string;
  code: string;
  score: number;
  grade: string;
  axes: AxisScores;
  why: WhyCard[];
  tags: FinTag[];
  peers: Peer[];
  simulation: {
    baseMarketRate: number;
    baseTrend: number;
    dataYear?: number;
    revenueGrowthRate?: number | null;
    momentum6m?: number | null;
  };
  priceHistory: PricePoint[];
}

export interface SimulationResult {
  year1: number;
  year3: number;
  year5: number;
  chartData: number[];
}
