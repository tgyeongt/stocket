import type { CompanyData } from "@/types";
import GaugeChart from "@/components/charts/GaugeChart";
import Section from "@/components/sections/Section";

const AXIS_META = [
  { key: "growth" as const, icon: "🚀", label: "성장성" },
  { key: "stability" as const, icon: "🛡", label: "안정성" },
  { key: "profitability" as const, icon: "💰", label: "수익성" },
  { key: "momentum" as const, icon: "📈", label: "시장 모멘텀" },
];

interface ScoreSectionProps {
  company: CompanyData;
}

export default function ScoreSection({ company }: ScoreSectionProps) {
  return (
    <Section step={1} label="성장 가능성 점수">
      <div
        className="rounded-[20px] p-8 flex items-center gap-10 border border-[rgba(34,197,94,0.25)] mb-[36px]"
        style={{
          background: "linear-gradient(135deg, #1A2A1A 0%, #1A1D27 60%)",
        }}
      >
        <GaugeChart score={company.score} />

        <div className="flex-1">
          <h2 className="text-[26px] font-bold tracking-[-0.5px] mb-1">
            {company.name}
          </h2>
          <p className="text-[13px] text-[#94A3B8] mb-5">
            {company.sector} · 코스피 {company.code}
          </p>

          <div className="inline-flex items-center gap-2 bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] rounded-lg px-4 py-2 mb-5">
            <span className="text-base">🚀</span>
            <span className="text-[14px] font-semibold text-[#22C55E]">
              {company.grade}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {AXIS_META.map(({ key, icon, label }) => {
              const val = company.axes[key];
              return (
                <div
                  key={key}
                  className="flex flex-col gap-1 px-2.5 py-2 bg-[rgba(255,255,255,0.02)] rounded-md"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-[#94A3B8]">
                      {icon} {label}
                    </span>
                    <span className="text-[13px] font-semibold text-[#F1F5F9]">
                      {val}
                    </span>
                  </div>
                  <div className="h-[5px] bg-[#22263A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#22C55E] rounded-full transition-[width] duration-1000 ease-out"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
