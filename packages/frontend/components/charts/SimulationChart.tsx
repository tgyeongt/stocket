"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ACCENT, TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, axisTick } from "./chart-theme";

interface SimulationChartProps {
  data: number[];
}

const LABELS = ["현재", "1년 후", "2년 후", "3년 후", "4년 후", "5년 후"];

export default function SimulationChart({ data }: SimulationChartProps) {
  const chartData = LABELS.map((label, i) => ({ label, value: data[i] }));

  return (
    <div className="relative w-full" role="img" aria-label="5년간 매출 성장 예측 선형 차트">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.12} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick(11)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={axisTick(11)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(value) => {
              if (typeof value !== "number") return [String(value), "성장 지수"];
              const diff = value - 100;
              const sign = diff >= 0 ? "+" : "";
              return [`${value} (${sign}${diff}%)`, "성장 지수"];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={ACCENT}
            strokeWidth={2.5}
            fill="url(#simGradient)"
            dot={{ fill: ACCENT, r: 5, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: ACCENT }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
