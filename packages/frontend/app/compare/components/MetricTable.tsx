import type { CompanyData } from "@/types";
import { AXES, COLOR_A, COLOR_B } from "../constants";

interface MetricTableProps {
  a: CompanyData;
  b: CompanyData;
}

export default function MetricTable({ a, b }: MetricTableProps) {
  const rows = [
    ...AXES.map(({ key, Icon, label }) => ({
      label,
      Icon,
      va: a.axes[key],
      vb: b.axes[key],
    })),
    { label: "종합 점수", Icon: null, va: a.score, vb: b.score },
  ];

  return (
    <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.07)]">
            <th className="text-left px-5 py-3 text-[#94A3B8] font-medium w-1/3">지표</th>
            <th className="text-right px-5 py-3 font-semibold" style={{ color: COLOR_A }}>
              {a.name}
            </th>
            <th className="text-right px-5 py-3 font-semibold" style={{ color: COLOR_B }}>
              {b.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, Icon, va, vb }) => (
            <tr key={label} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <td className="px-5 py-3 text-[#94A3B8]">
                <span className="flex items-center gap-1.5">
                  {Icon && <Icon />}
                  {label}
                </span>
              </td>
              <td
                className="px-5 py-3 text-right font-semibold"
                style={{ color: va > vb ? COLOR_A : "#F1F5F9" }}
              >
                {va}
              </td>
              <td
                className="px-5 py-3 text-right font-semibold"
                style={{ color: vb > va ? COLOR_B : "#F1F5F9" }}
              >
                {vb}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
