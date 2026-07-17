"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface Suggestion {
  corpName: string;
  stockCode: string;
}

// SearchSection/SearchInput이 공유하는 디바운스 자동완성 조회.
// suggestions/open을 fetch 완료 콜백(비동기) 안에서 함께 세팅해
// effect 본문에서 직접 setState하는 것(react-hooks/set-state-in-effect)을 피한다.
export function useCompanySuggestions(query: string, skip: boolean, limit = 8) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (skip) return;

    timerRef.current = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch(`/api/companies/search?query=${encodeURIComponent(q)}&limit=${limit}`);
        if (!res.ok) return;
        const body = await res.json();
        const seen = new Set<string>();
        const items: Suggestion[] = (body.data ?? [])
          .map((d: { corpName?: string; name?: string; stockCode?: string; code?: string }) => ({
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
      } catch {
        // 자동완성 실패는 무시
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, skip, limit]);

  return { suggestions, setSuggestions, open, setOpen };
}

// 검색창 바깥 클릭 시 콜백 실행 (드롭다운 닫기용)
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
