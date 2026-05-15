"use client";

import { useState } from "react";
import type { CompanyData } from "@/types";
import { calcSimulation } from "@/lib/simulation";
import SimulationChart from "@/components/charts/SimulationChart";
import Section from "@/components/sections/Section";
import FinTag from "@/components/ui/FinTag";

interface SimulationSectionProps {
  company: CompanyData;
}

export default function SimulationSection({ company }: SimulationSectionProps) {
  const [prevCode, setPrevCode] = useState(company.code);
  const [marketRate, setMarketRate] = useState(company.simulation.baseMarketRate);
  const [trend, setTrend] = useState(company.simulation.baseTrend);

  if (prevCode !== company.code) {
    setPrevCode(company.code);
    setMarketRate(company.simulation.baseMarketRate);
    setTrend(company.simulation.baseTrend);
  }

  const sim = calcSimulation(marketRate, trend);

  return (
    <Section step={2} label="미래 성장 시뮬레이션" className="">
      <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-6 pb-2">
          <div>
            <h3 className="text-[17px] font-semibold">성장 시나리오 시뮬레이터</h3>
            <p className="text-[12px] text-[#94A3B8] mt-[3px]">슬라이더를 조정해 다양한 시장 상황의 성장 예측을 확인하세요</p>
          </div>
          <FinTag label="기준:" value="2024년 매출" />
        </div>

        <div className="flex items-center gap-3.5 mb-4 px-1 py-1.5">
          <span className="text-[13px] text-[#94A3B8] whitespace-nowrap min-w-[90px]">시장 성장률</span>
          <input type="range" min={2} max={25} step={1} value={marketRate} onChange={(e) => setMarketRate(Number(e.target.value))} className="flex-1" />
          <span className="text-[14px] font-semibold text-[#22C55E] min-w-[44px] text-right">{marketRate}%</span>
        </div>

        <div className="flex items-center gap-3.5 mb-6 px-1 py-1.5">
          <span className="text-[13px] text-[#94A3B8] whitespace-nowrap min-w-[90px]">현재 성장세</span>
          <input type="range" min={50} max={150} step={1} value={trend} onChange={(e) => setTrend(Number(e.target.value))} className="flex-1" />
          <span className="text-[14px] font-semibold text-[#22C55E] min-w-[44px] text-right">{trend}%</span>
        </div>

        <div className="grid grid-cols-3 gap-3.5 mb-5">
          {[
            { label: "1년 후", value: sim.year1 },
            { label: "3년 후", value: sim.year3 },
            { label: "5년 후", value: sim.year5 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#22263A] rounded-[12px] p-4 text-center">
              <p className="text-[11px] text-[#94A3B8] mb-1.5">{label}</p>
              <p className="text-[22px] font-bold text-[#22C55E]">+{value}%</p>
            </div>
          ))}
        </div>

        <SimulationChart data={sim.chartData} />
      </div>
    </Section>
  );
}
