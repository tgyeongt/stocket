import SectionLabel from "@/components/ui/SectionLabel";

interface SectionProps {
  step: number;
  label: string;
  children: React.ReactNode;
  className?: string;
}

export default function Section({ step, label, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-[20px]">
      <SectionLabel step={step}>{label}</SectionLabel>
      {children}
    </section>
  );
}
