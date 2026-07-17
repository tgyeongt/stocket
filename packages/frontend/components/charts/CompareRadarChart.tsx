"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { CompanyData } from "@/types";
import { AXES } from "@/app/compare/constants";

interface Props {
  a: CompanyData;
  b: CompanyData;
}

export default function CompareRadarChart({ a, b }: Props) {
  const data = AXES.map(({ key, label }) => ({
    axis: label,
    [a.name]: a.axes[key],
    [b.name]: b.axes[key],
  }));

  return (
    <div className="flex flex-col">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart
          data={data}
          margin={{ top: 0, right: 40, bottom: 0, left: 40 }}
        >
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#94A3B8", fontSize: 12 }}
          />
          <Radar
            name={a.name}
            dataKey={a.name}
            stroke="#22C55E"
            fill="#22C55E"
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Radar
            name={b.name}
            dataKey={b.name}
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          {a.name}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          {b.name}
        </span>
      </div>
    </div>
  );
}
