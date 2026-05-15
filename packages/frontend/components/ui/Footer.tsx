const TECH_PILLS = ["DART API", "KIS API", "Pandas"];

export default function Footer() {
  return (
    <footer className="mt-12 pt-6 border-t border-[rgba(255,255,255,0.07)] flex items-center justify-between">
      <p className="text-[12px] text-[#475569] max-w-[1000px] leading-relaxed mr-[10px]">
        데이터 출처: DART 공시시스템 + KIS 한국투자증권 API · Pandas 분석 기반 ·
        본 서비스는 투자 참고용이며 투자 결과에 대한 책임은 투자자 본인에게
        있습니다.
      </p>
      <div className="flex gap-2">
        {TECH_PILLS.map((pill) => (
          <span
            key={pill}
            className="bg-[#22263A] rounded-md px-2.5 py-1 text-[11px] text-[#94A3B8]"
          >
            {pill}
          </span>
        ))}
      </div>
    </footer>
  );
}
