interface AxisIconProps {
  className?: string;
}

export function GrowthIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function StabilityIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </svg>
  );
}

export function ProfitabilityIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10a2.5 2.5 0 0 1 2.5-1.5c1.4 0 2.5.8 2.5 2s-1 1.5-2.5 1.5S9 12.8 9 14s1.1 2 2.5 2a2.5 2.5 0 0 0 2.5-1.5" />
    </svg>
  );
}

export function MomentumIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

// 성장성/안정성/수익성/모멘텀 4축 메타데이터 (ScoreSection, compare 페이지가 공유)
export const AXES = [
  { key: "growth" as const, Icon: GrowthIcon, label: "성장성" },
  { key: "stability" as const, Icon: StabilityIcon, label: "안정성" },
  { key: "profitability" as const, Icon: ProfitabilityIcon, label: "수익성" },
  { key: "momentum" as const, Icon: MomentumIcon, label: "모멘텀" },
];

export function InfoIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
