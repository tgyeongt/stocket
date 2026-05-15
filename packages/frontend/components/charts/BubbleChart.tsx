"use client";

import type { Peer } from "@/types";

interface BubbleChartProps {
  centerName: string;
  centerScore: number;
  peers: Peer[];
}

const POSITIONS = [
  [350, 145],
  [190, 85],
  [500, 85],
  [250, 235],
  [350, 235],
] as const;

const STROKE_COLORS = [
  "rgba(34,197,94,1)",
  "rgba(34,197,94,0.6)",
  "rgba(34,197,94,0.4)",
  "rgba(34,197,94,0.3)",
];

export default function BubbleChart({
  centerName,
  centerScore,
  peers,
}: BubbleChartProps) {
  const allBubbles = [
    { name: centerName, correlation: 100, score: centerScore },
    ...peers,
  ].slice(0, 4);

  return (
    <svg
      viewBox="0 0 700 290"
      className="w-full h-full"
      aria-label="유사 기업 버블 차트"
      role="img"
    >
      {allBubbles.slice(1).map((_, i) => {
        const [bx, by] = POSITIONS[i + 1];
        return (
          <line
            key={i}
            x1={350}
            y1={145}
            x2={bx}
            y2={by}
            stroke="rgba(34,197,94,0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Bubbles */}
      {allBubbles.map((b, i) => {
        const [bx, by] = POSITIONS[i];
        const r = i === 0 ? 62 : 28 + (b.correlation - 60) * 0.5;
        const shortName = b.name.length > 8 ? b.name.slice(0, 8) + "…" : b.name;

        return (
          <g key={i}>
            <circle
              cx={bx}
              cy={by}
              r={r}
              fill={i === 0 ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.1)"}
              stroke={STROKE_COLORS[Math.min(i, 3)]}
              strokeWidth={1.5}
            />
            <text
              x={bx}
              y={i === 0 ? by : by - 2}
              textAnchor="middle"
              fontSize={i === 0 ? 16 : 11}
              fontWeight={600}
              fill="#F1F5F9"
            >
              {shortName}
            </text>
            <text
              x={bx}
              y={i === 0 ? by + 17 : by + 13}
              textAnchor="middle"
              fontSize={10}
              fill="#22C55E"
            >
              {b.score}점
            </text>
          </g>
        );
      })}
    </svg>
  );
}
