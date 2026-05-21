import type { CompanyData } from "@/types";
import { AXES } from "../constants";

interface CompanyCardProps {
  company: CompanyData;
  color: string;
}

export default function CompanyCard({ company, color }: CompanyCardProps) {
  return (
    <div
      className="flex-1 rounded-2xl p-5 border"
      style={{ borderColor: `${color}30`, background: "#161923" }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0 mr-2">
          <h3 className="text-[18px] font-bold truncate">{company.name}</h3>
          <p className="text-[12px] text-[#94A3B8]">{company.sector} · {company.code}</p>
        </div>
        <span className="text-[26px] font-black shrink-0" style={{ color }}>
          {company.score}
        </span>
      </div>
      <div
        className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-[13px] font-semibold mb-5"
        style={{ background: `${color}20`, color }}
      >
        {company.grade}
      </div>
      <div className="flex flex-col gap-2.5">
        {AXES.map(({ key, icon, label }) => {
          const val = company.axes[key];
          return (
            <div key={key}>
              <div className="flex justify-between text-[11px] text-[#94A3B8] mb-1">
                <span>{icon} {label}</span>
                <span className="font-semibold text-[#F1F5F9]">{val}</span>
              </div>
              <div className="h-[5px] bg-[#22263A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${val}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
