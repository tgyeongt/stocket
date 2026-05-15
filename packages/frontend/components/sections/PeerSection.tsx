import type { CompanyData } from "@/types";
import BubbleChart from "@/components/charts/BubbleChart";
import Section from "@/components/sections/Section";

interface PeerSectionProps {
  company: CompanyData;
}

export default function PeerSection({ company }: PeerSectionProps) {
  return (
    <Section step={4} label="유사 기업 비교 — 비슷한 성장 패턴">

      <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6 mb-[36px]">
        <p className="text-[13px] text-[#94A3B8] mb-4">
          성장 패턴이 비슷한 기업일수록 중심에 가깝게 표시돼요
        </p>
        <div className="relative w-full h-[300px]">
          <BubbleChart
            centerName={company.name}
            centerScore={company.score}
            peers={company.peers}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {company.peers.map((peer) => (
          <div
            key={peer.name}
            className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-[12px] px-5 py-[18px]"
          >
            <p className="text-[12px] text-[#94A3B8] mb-1.5">
              상관도 {peer.correlation}%
            </p>
            <p className="text-[15px] font-semibold mb-1">{peer.name}</p>
            <div className="flex gap-2 items-center pt-0.5">
              <span className="text-[12px] text-[#94A3B8]">성장성 점수</span>
              <span className="text-[14px] font-semibold text-[#22C55E]">
                {peer.score}점
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
