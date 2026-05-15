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
import { PRICE_MONTHS } from "@/lib/mockData";

interface PriceChartProps {
  prices: number[];
  companyName: string;
}

export default function PriceChart({ prices, companyName }: PriceChartProps) {
  const data = PRICE_MONTHS.map((month, i) => ({ month, price: prices[i] }));

  return (
    <div
      className="relative w-full"
      role="img"
      aria-label={`${companyName} 12개월 주가 추이 차트`}
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 25, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1A1D27",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              color: "#F1F5F9",
              fontSize: 12,
            }}
            labelStyle={{ color: "#94A3B8" }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={{ fill: "#22C55E", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22C55E" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
