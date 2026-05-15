"use client";

import { useState, KeyboardEvent } from "react";
import { QUICK_CHIPS } from "@/lib/mockData";

interface SearchSectionProps {
  onSearch: (name: string) => void;
  loading: boolean;
  activeChip: string;
}

export default function SearchSection({
  onSearch,
  loading,
  activeChip,
}: SearchSectionProps) {
  const [input, setInput] = useState(activeChip);

  function handleChip(name: string) {
    setInput(name);
    onSearch(name);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearch(input.trim());
  }

  return (
    <div className="mb-12">
      <p className="text-[13px] text-[#94A3B8] mb-2.5">
        기업 검색으로 시작하세요
      </p>
      <div className="flex gap-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="기업명 또는 종목코드 입력 (예: 삼성전자, 005930)"
          className="flex-1 bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[18px] py-[14px] text-[16px] text-[#F1F5F9] placeholder:text-[#475569] outline-none focus:border-[#22C55E] transition-colors font-[inherit]"
        />
        <button
          onClick={() => onSearch(input.trim())}
          disabled={loading}
          className="bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-60 text-white rounded-[10px] px-[28px] py-[14px] text-[15px] font-semibold cursor-pointer transition-colors whitespace-nowrap font-[inherit]"
        >
          {loading ? "분석 중…" : "성장성 분석 →"}
        </button>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {QUICK_CHIPS.map((name) => (
          <button
            key={name}
            onClick={() => handleChip(name)}
            className={`rounded-full px-3.5 py-[5px] text-[12px] cursor-pointer border transition-all font-[inherit] ${
              activeChip === name
                ? "border-[#22C55E] text-[#22C55E] bg-[rgba(34,197,94,0.08)]"
                : "border-[rgba(255,255,255,0.07)] bg-[#1A1D27] text-[#94A3B8] hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-[rgba(34,197,94,0.08)]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
