"use client";

import { useState, useEffect, useRef } from "react";

interface SearchInputProps {
  label: string;
  color: string;
  onSelect: (name: string) => void;
  loading: boolean;
}

export default function SearchInput({ label, color, onSelect, loading }: SearchInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ corpName: string; stockCode: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (selected) return;
    timerRef.current = setTimeout(async () => {
      const q = input.trim();
      if (!q) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch(`/api/companies/search?query=${encodeURIComponent(q)}&limit=6`);
        if (!res.ok) return;
        const body = await res.json();
        const items = (body.data ?? []).map((d: { corpName?: string; name?: string; stockCode?: string; code?: string }) => ({
          corpName: d.corpName ?? d.name ?? "",
          stockCode: d.stockCode ?? d.code ?? "",
        }));
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch { /* 자동완성 실패 무시 */ }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [input, selected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(name: string) {
    if (!name.trim()) return;
    setInput(name);
    setOpen(false);
    setSuggestions([]);
    setSelected(true);
    onSelect(name);
  }

  return (
    <div className="flex-1 min-w-0" ref={wrapperRef}>
      <p className="text-[12px] font-semibold mb-2" style={{ color }}>
        {label}
      </p>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (selected) setSelected(false);
          }}
          onFocus={() => !selected && suggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") select(input.trim());
          }}
          placeholder="기업명 검색"
          className="w-full bg-[#1A1D27] border rounded-[10px] px-4 py-3 text-[15px] text-[#F1F5F9] placeholder:text-[#475569] outline-none transition-colors font-[inherit]"
          style={{ borderColor: selected ? `${color}99` : `${color}55` }}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[12px] animate-pulse">
            분석 중…
          </span>
        )}
        {open && !selected && (
          <ul className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-[#1A1D27] border border-[rgba(255,255,255,0.10)] rounded-[10px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {suggestions.map((s) => (
              <li
                key={s.stockCode || s.corpName}
                onMouseDown={() => select(s.corpName)}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] text-[14px] text-[#F1F5F9]"
              >
                <span>{s.corpName}</span>
                {s.stockCode && (
                  <span className="text-[12px] text-[#475569] ml-3">{s.stockCode}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
