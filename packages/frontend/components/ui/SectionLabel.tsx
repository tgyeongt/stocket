interface SectionLabelProps {
  step: number;
  children: React.ReactNode;
}

export default function SectionLabel({ step, children }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2 py-1 text-[11px] font-semibold tracking-[0.1em] text-[#94A3B8]">
      <span className="w-5 h-5 rounded-full bg-[#22C55E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {step}
      </span>
      {children}
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
    </div>
  );
}
