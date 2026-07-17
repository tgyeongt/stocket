// PriceChart/ComparePriceChart/SimulationChart이 공유하는 recharts 테마 값

export const ACCENT = "#22C55E";

export const TOOLTIP_STYLE = {
  background: "#1A1D27",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 8,
  color: "#F1F5F9",
  fontSize: 12,
};

export const TOOLTIP_LABEL_STYLE = { color: "#94A3B8" };

export function axisTick(fontSize = 10) {
  return { fill: "#94A3B8", fontSize };
}
