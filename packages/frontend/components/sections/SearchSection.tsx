"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";

const QUICK_CHIPS = ["삼성전자", "SK하이닉스", "NAVER", "카카오", "LG에너지솔루션"];

interface Suggestion {
  corpName: string;
  stockCode: string;
}

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  // 입력값이 바뀔 때마다 300ms 디바운스 후 검색 API 호출
  useEffect(() => {
    // 칩/제안 선택으로 인한 input 변경은 자동완성 건너뜀
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const query = input.trim();
    if (!query) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/companies/search?query=${encodeURIComponent(query)}&limit=8`
        );
        if (!res.ok) return;
        const body = await res.json();
        const seen = new Set<string>();
        const items: Suggestion[] = (body.data ?? [])
          .map((d: any) => ({
            corpName: d.corpName ?? d.name ?? "",
            stockCode: d.stockCode ?? d.code ?? "",
          }))
          .filter((s: Suggestion) => {
            const key = s.stockCode || s.corpName;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        setSuggestions(items);
        setOpen(items.length > 0);
        setFocusedIdx(-1);
      } catch {
        // 자동완성 실패는 무시
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(name: string) {
    skipSearchRef.current = true;
    setInput(name);
    setSuggestions([]);
    setOpen(false);
    onSearch(name);
  }

  function handleChip(name: string) {
    skipSearchRef.current = true;
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
        selectSuggestion(suggestions[focusedIdx].corpName);
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
            onChange={(e) => setInput(e.target.value)}
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
                  onMouseDown={() => selectSuggestion(s.corpName)}
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
