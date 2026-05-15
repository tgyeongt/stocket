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

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full border border-[#475569] text-[#475569] text-[10px] flex items-center justify-center hover:border-[#94A3B8] hover:text-[#94A3B8] transition-colors cursor-help"
        aria-label="설명 보기"
      >
        ?
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[230px] bg-[#0F1117] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-3 py-2.5 text-[11px] text-[#94A3B8] leading-[1.6] z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-none whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[rgba(255,255,255,0.12)]" />
        </span>
      )}
    </span>
  );
}

function fmtRate(v: number | null | undefined): string {
  if (v == null) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
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

  const marketRateTooltip =
    company.simulation.revenueGrowthRate != null
      ? `전년도 매출 YoY 성장률(${fmtRate(company.simulation.revenueGrowthRate)})을 기반으로 설정됐어요. 0~30% 범위로 조정되며, 슬라이더로 다양한 시장 시나리오를 탐색할 수 있어요.`
      : `해당 기업의 전년도 매출 성장률을 기반으로 설정됩니다 (데이터 없을 시 기본값 7%). 슬라이더로 다양한 시장 시나리오를 탐색할 수 있어요.`;

  const trendTooltip =
    company.simulation.momentum6m != null
      ? `최근 6개월 주가 수익률(${fmtRate(company.simulation.momentum6m)})을 기반으로 설정됐어요. 100이 현재 성장세 유지, 100 초과는 가속 성장, 미만은 성장 둔화를 의미해요.`
      : `최근 6개월 주가 모멘텀을 기반으로 설정됩니다 (데이터 없을 시 기본값 100%). 100이 현재 성장세 유지, 높을수록 강한 성장세를 의미해요.`;

  return (
    <Section step={2} label="미래 성장 시뮬레이션" className="">
      <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-6 pb-2">
          <div>
            <h3 className="text-[17px] font-semibold">성장 시나리오 시뮬레이터</h3>
            <p className="text-[12px] text-[#94A3B8] mt-[3px]">슬라이더를 조정해 다양한 시장 상황의 성장 예측을 확인하세요</p>
          </div>
          <FinTag label="기준:" value={`${company.simulation.dataYear ?? new Date().getFullYear() - 1}년 매출`} />
        </div>

        <div className="flex items-center gap-3.5 mb-4 px-1 py-1.5">
          <span className="text-[13px] text-[#94A3B8] whitespace-nowrap min-w-[90px] flex items-center">
            시장 성장률
            <InfoTooltip text={marketRateTooltip} />
          </span>
          <input type="range" min={2} max={25} step={1} value={marketRate} onChange={(e) => setMarketRate(Number(e.target.value))} className="flex-1" />
          <span className="text-[14px] font-semibold text-[#22C55E] min-w-[44px] text-right">{marketRate}%</span>
        </div>

        <div className="flex items-center gap-3.5 mb-6 px-1 py-1.5">
          <span className="text-[13px] text-[#94A3B8] whitespace-nowrap min-w-[90px] flex items-center">
            현재 성장세
            <InfoTooltip text={trendTooltip} />
          </span>
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
