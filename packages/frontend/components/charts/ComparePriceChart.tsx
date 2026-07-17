"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CompanyData } from "@/types";
import { TOOLTIP_STYLE, axisTick } from "./chart-theme";

interface Props {
  a: CompanyData;
  b: CompanyData;
}

function label(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ComparePriceChart({ a, b }: Props) {
  const aPrices = a.priceHistory;
  const bPrices = b.priceHistory;
  const aBase = aPrices[0]?.price ?? 1;
  const bBase = bPrices[0]?.price ?? 1;

  const longer = aPrices.length >= bPrices.length ? aPrices : bPrices;

  const data = longer.map((point, i) => ({
    date: label(point.date),
    [a.name]: aPrices[i]
      ? parseFloat(((aPrices[i].price / aBase) * 100).toFixed(2))
      : undefined,
    [b.name]: bPrices[i]
      ? parseFloat(((bPrices[i].price / bBase) * 100).toFixed(2))
      : undefined,
  }));

  return (
    <div>
      <p className="text-[11px] text-[#475569] mb-3">
        첫 데이터 포인트 기준 100으로 정규화한 상대 수익률
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={axisTick()}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisTick()}
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={(v: number) => v.toFixed(0)}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [typeof value === "number" ? `${value.toFixed(1)}` : String(value), ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ color: "#94A3B8", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey={a.name}
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey={b.name}
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
