interface FinTagProps {
  label: string;
  value: string;
}

export default function FinTag({ label, value }: FinTagProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#22263A] rounded-lg px-3 py-1.5 text-[12px] text-[#94A3B8]">
      {label} <span className="text-[#22C55E] font-semibold">{value}</span>
    </div>
  );
}
