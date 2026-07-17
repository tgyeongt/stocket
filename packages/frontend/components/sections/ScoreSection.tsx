import type { CompanyData } from "@/types";
import GaugeChart from "@/components/charts/GaugeChart";
import Section from "@/components/sections/Section";
import {
  GrowthIcon,
  StabilityIcon,
  ProfitabilityIcon,
  MomentumIcon,
} from "@/components/icons/axis-icons";

const AXIS_META = [
  { key: "growth" as const, Icon: GrowthIcon, label: "성장성" },
  { key: "stability" as const, Icon: StabilityIcon, label: "안정성" },
  { key: "profitability" as const, Icon: ProfitabilityIcon, label: "수익성" },
  { key: "momentum" as const, Icon: MomentumIcon, label: "시장 모멘텀" },
];

interface ScoreSectionProps {
  company: CompanyData;
}

export default function ScoreSection({ company }: ScoreSectionProps) {
  return (
    <Section label="성장 가능성 점수">
      <div className="rounded-[20px] p-6 sm:p-8 border border-border mb-[36px]">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 mb-6">
          <GaugeChart score={company.score} />

          <div className="w-full sm:flex-1">
            <h2 className="text-[26px] font-bold tracking-[-0.5px] mb-1">
              {company.name}
            </h2>
            <p className="text-[13px] text-muted mb-4">
              {company.sector} · 코스피 {company.code}
            </p>
            <div className="inline-flex items-center border border-accent/30 rounded-lg px-4 py-2">
              <span className="text-[14px] font-semibold text-accent">
                {company.grade}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border mb-6" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {AXIS_META.map(({ key, Icon, label }) => {
            const val = company.axes[key];
            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-2 text-muted">
                  <Icon className="flex-shrink-0" />
                  <span className="text-[11px]">{label}</span>
                </div>
                <div className="text-[18px] font-semibold mb-1.5">{val}</div>
                <div className="h-[2px] bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-[width] duration-1000 ease-out"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
