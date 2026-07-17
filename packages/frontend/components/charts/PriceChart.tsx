"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PricePoint } from "@/types";
import { ACCENT, TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, axisTick } from "./chart-theme";

interface PriceChartProps {
  prices: PricePoint[];
  companyName: string;
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PriceChart({ prices, companyName }: PriceChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const displayPrices = isMobile ? prices.slice(-10) : prices;
  const data = displayPrices.map((p) => ({ month: formatLabel(p.date), price: p.price }));

  const maxPrice = Math.max(...displayPrices.map((p) => p.price));
  const yAxisWidth = maxPrice.toLocaleString("ko-KR").length * 7 + 8;

  return (
    <div
      className="relative w-full"
      role="img"
      aria-label={`${companyName} 주가 추이 차트`}
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 25, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={axisTick()}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisTick()}
            axisLine={false}
            tickLine={false}
            width={yAxisWidth}
            tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(value) => [
              typeof value === "number"
                ? `${value.toLocaleString("ko-KR")}원`
                : String(value),
            ]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ACCENT }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
