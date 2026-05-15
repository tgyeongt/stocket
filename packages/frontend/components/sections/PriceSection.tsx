import type { CompanyData } from "@/types";
import PriceChart from "@/components/charts/PriceChart";
import Section from "@/components/sections/Section";

interface PriceSectionProps {
  company: CompanyData;
}

export default function PriceSection({ company }: PriceSectionProps) {
  return (
    <Section step={5} label="주가 추이" className="">
      <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl mb-[36px]">
        <PriceChart prices={company.priceHistory} companyName={company.name} />
      </div>
    </Section>
  );
}
