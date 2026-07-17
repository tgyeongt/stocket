import type { CompanyData } from "@/types";
import PriceChart from "@/components/charts/PriceChart";
import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";

interface PriceSectionProps {
  company: CompanyData;
}

export default function PriceSection({ company }: PriceSectionProps) {
  return (
    <Section label="주가 추이">
      <Card className="mb-[36px]">
        <PriceChart prices={company.priceHistory} companyName={company.name} />
      </Card>
    </Section>
  );
}
