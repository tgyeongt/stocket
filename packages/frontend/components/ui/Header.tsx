import Image from "next/image";
import Logo from "@/assets/stocket_logo.svg";

export default function Header() {
  return (
    <header className="flex items-center mb-10 gap-[12px]">
      <div>
        <Image src={Logo} alt="logo" className="w-[90px]" />
        <p className="text-[#93A3B8] text-[12px] mt-[2px] ml-[5px]">
          초보 투자자를 위한 성장 가능성 분석 플랫폼
        </p>
      </div>
    </header>
  );
}
