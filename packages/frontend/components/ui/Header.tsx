import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/stocket_logo.svg";

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-10 gap-[12px]">
      <Link href="/" className="flex flex-col">
        <Image src={Logo} alt="logo" className="w-[90px]" />
        <p className="text-[#93A3B8] text-[12px] mt-[2px] ml-[5px]">
          초보 투자자를 위한 성장 가능성 분석 플랫폼
        </p>
      </Link>
      <Link
        href="/compare"
        className="text-[13px] text-[#94A3B8] hover:text-[#22C55E] border border-[rgba(255,255,255,0.13)] hover:border-[rgba(34,197,94,0.4)] rounded-lg px-3.5 py-2 transition-colors whitespace-nowrap"
      >
        기업 비교 →
      </Link>
    </header>
  );
}
