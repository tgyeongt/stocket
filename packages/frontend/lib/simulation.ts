import type { SimulationResult } from "@/types";

export function calcSimulation(
  marketRate: number,
  trend: number
): SimulationResult {
  const base = marketRate * (trend / 100);
  const year1 = Math.round(base * 1.2);
  const year3 = Math.round(base * 1.2 * Math.pow(1 + marketRate / 100, 2) + year1);
  const year5 = Math.round(year3 * Math.pow(1 + (marketRate / 100) * 0.9, 2) + 10);

  const chartData = [
    100,
    100 + year1,
    100 + Math.round(year3 * 0.55),
    100 + year3,
    100 + Math.round(year5 * 0.8),
    100 + year5,
  ];

  return { year1, year3, year5, chartData };
}
