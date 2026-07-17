import type { CompanyData } from "@/types";
import BubbleChart from "@/components/charts/BubbleChart";
import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";

interface PeerSectionProps {
  company: CompanyData;
}

export default function PeerSection({ company }: PeerSectionProps) {
  if (company.peers.length === 0) {
    return (
      <Section label="유사 기업 비교 — 같은 업종 · 비슷한 성장 패턴">
        <Card className="p-6 mb-6 text-center">
          <p className="text-[14px] font-semibold mb-1.5">
            아직 비교할 유사 기업이 없어요
          </p>
          <p className="text-[13px] text-muted">
            같은 업종으로 등록된 다른 기업 데이터가 아직 충분하지 않아요. 데이터가 쌓이면 표시될 예정이에요.
          </p>
        </Card>
      </Section>
    );
  }

  return (
    <Section label="유사 기업 비교 — 같은 업종 · 비슷한 성장 패턴">
      <Card className="p-6 mb-[36px]">
        <p className="text-[13px] text-muted mb-4">
          같은 업종 기업 중 성장 패턴이 비슷할수록 중심에 가깝게 표시돼요
        </p>
        <div className="relative w-full h-[300px]">
          <BubbleChart
            centerName={company.name}
            centerScore={company.score}
            peers={company.peers}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        {company.peers.map((peer) => (
          <div
            key={peer.name}
            className="bg-surface border border-border rounded-[12px] px-5 py-[18px]"
          >
            <p className="text-[12px] text-muted mb-1.5">
              성장 패턴 유사도 {peer.correlation}%
            </p>
            <p className="text-[15px] font-semibold mb-1">{peer.name}</p>
            <div className="flex gap-2 items-center pt-0.5">
              <span className="text-[12px] text-muted">성장성 점수</span>
              <span className="text-[14px] font-semibold text-accent">
                {peer.score}점
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
