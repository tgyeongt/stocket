"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useCompanySuggestions, useClickOutside } from "@/hooks/useCompanySuggestions";

const QUICK_CHIPS = ["삼성전자", "SK하이닉스", "NAVER", "카카오", "LG에너지솔루션"];

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
  // 최초 마운트 및 칩/제안 선택 직후에는 자동완성 검색을 건너뜀
  const [selected, setSelected] = useState(true);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { suggestions, setSuggestions, open, setOpen } = useCompanySuggestions(input, selected, 8);

  useClickOutside(wrapperRef, () => setOpen(false));

  function pick(name: string) {
    setSelected(true);
    setInput(name);
    setSuggestions([]);
    setOpen(false);
    onSearch(name);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Enter" && focusedIdx >= 0) {
        pick(suggestions[focusedIdx].corpName);
        return;
      }
    }
    if (e.key === "Enter") {
      setOpen(false);
      onSearch(input.trim());
    }
  }

  return (
    <div className="mb-12">
      <p className="text-[13px] text-[#94A3B8] mb-2.5">
        기업 검색으로 시작하세요
      </p>
      <div className="flex gap-2.5">
        {/* 검색 입력 + 드롭다운 */}
        <div ref={wrapperRef} className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFocusedIdx(-1);
              if (selected) setSelected(false);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="기업명 또는 종목코드 입력 (예: 삼성전자, 005930)"
            className="w-full bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[18px] py-[14px] text-[16px] text-[#F1F5F9] placeholder:text-[#475569] outline-none focus:border-[#22C55E] transition-colors font-[inherit]"
          />

          {open && (
            <ul className="absolute z-50 left-0 right-0 top-[calc(100%+6px)] bg-[#1A1D27] border border-[rgba(255,255,255,0.10)] rounded-[10px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              {suggestions.map((s, idx) => (
                <li
                  key={s.stockCode || s.corpName}
                  onMouseDown={() => pick(s.corpName)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={`flex items-center justify-between px-[18px] py-[11px] cursor-pointer transition-colors ${
                    idx === focusedIdx
                      ? "bg-[rgba(34,197,94,0.10)]"
                      : "hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  <span className="text-[14px] text-[#F1F5F9]">{s.corpName}</span>
                  {s.stockCode && (
                    <span className="text-[12px] text-[#475569] ml-3 shrink-0">
                      {s.stockCode}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={() => { setOpen(false); onSearch(input.trim()); }}
          disabled={loading}
          className="bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-60 text-white rounded-[10px] px-[16px] sm:px-[28px] py-[14px] text-[14px] sm:text-[15px] font-semibold cursor-pointer transition-colors whitespace-nowrap font-[inherit]"
        >
          {loading ? "분석 중…" : "성장성 분석 →"}
        </button>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {QUICK_CHIPS.map((name) => (
          <button
            key={name}
            onClick={() => pick(name)}
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
