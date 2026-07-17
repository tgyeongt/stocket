interface SectionProps {
  label: string;
  children: React.ReactNode;
}

export default function Section({ label, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-[20px]">
      <div className="flex items-center gap-2.5 py-1">
        <span className="w-[3px] h-[14px] bg-accent rounded-full flex-shrink-0" />
        <span className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}
