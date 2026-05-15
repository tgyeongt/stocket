import type { CompanyData } from "@/types";
import Section from "@/components/sections/Section";
import FinTag from "@/components/ui/FinTag";

interface ExplainSectionProps {
  company: CompanyData;
}

export default function ExplainSection({ company }: ExplainSectionProps) {
  return (
    <Section step={3} label="왜 성장 가능성이 높은가?">

      <div className="grid grid-cols-2 gap-3 mb-[36px]">
        {company.why.map((card, i) => (
          <div
            key={i}
            className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-[12px] px-[18px] py-4 flex gap-3 items-start"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(34,197,94,0.12)] flex items-center justify-center flex-shrink-0 text-[17px]">
              {card.icon}
            </div>
            <div className="pt-0.5">
              <strong className="block text-[13px] font-semibold mb-1">
                {card.title}
              </strong>
              <span
                className="text-[12px] text-[#94A3B8] leading-[1.5]"
                dangerouslySetInnerHTML={{ __html: card.body }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 flex-wrap mb-10">
        {company.tags.map((tag) => (
          <FinTag key={tag.label} label={tag.label} value={tag.value} />
        ))}
      </div>
    </Section>
  );
}
