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
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }}
            labelStyle={{ color: "#94A3B8" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#22C55E"
            strokeWidth={2.5}
            fill="url(#simGradient)"
            dot={{ fill: "#22C55E", r: 5, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#22C55E" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
