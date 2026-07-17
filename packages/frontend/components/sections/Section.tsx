import SectionLabel from "@/components/ui/SectionLabel";

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

export default function Section({ label, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-[20px]">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  );
}
