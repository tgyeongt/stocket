import {
  GrowthIcon,
  StabilityIcon,
  ProfitabilityIcon,
  MomentumIcon,
} from "@/components/icons/axis-icons";

export const COLOR_A = "#22C55E";
export const COLOR_B = "#3B82F6";

export const AXES = [
  { key: "growth" as const, Icon: GrowthIcon, label: "성장성" },
  { key: "stability" as const, Icon: StabilityIcon, label: "안정성" },
  { key: "profitability" as const, Icon: ProfitabilityIcon, label: "수익성" },
  { key: "momentum" as const, Icon: MomentumIcon, label: "모멘텀" },
];
