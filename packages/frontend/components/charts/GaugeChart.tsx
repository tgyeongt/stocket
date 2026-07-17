"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { ACCENT } from "./chart-theme";

interface GaugeChartProps {
  score: number;
}

// 270° 아크(6시 방향 90°가 빈 게이지)를 recharts RadialBarChart로 그린다.
// PolarAngleAxis의 domain을 [0, 100]으로 고정해야 score가 실제 백분율로 채워진다.
export default function GaugeChart({ score }: GaugeChartProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
      <RadialBarChart
        width={180}
        height={180}
        cx="50%"
        cy="50%"
        innerRadius={63}
        outerRadius={77}
        startAngle={225}
        endAngle={-45}
        data={[{ value: score }]}
        role="img"
        aria-label={`성장 가능성 점수 ${score}점`}
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={7}
          fill="url(#gaugeGradient)"
          background={{ fill: "#2A2F42" }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </RadialBarChart>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] text-center pointer-events-none">
        <div className="text-[38px] font-bold leading-none" style={{ color: ACCENT }}>
          {score}
        </div>
        <div className="text-[11px] text-[#94A3B8] mt-1">/ 100점</div>
      </div>
    </div>
  );
}
