"use client";

import { useState, useCallback } from "react";
import type { CompanyData } from "@/types";
import { MOCK_COMPANIES } from "@/lib/mockData";

interface UseCompanyReturn {
  data: CompanyData | null;
  loading: boolean;
  error: string | null;
  fetchCompany: (name: string) => Promise<void>;
}

export function useCompany(initial?: string): UseCompanyReturn {
  const [data, setData] = useState<CompanyData | null>(
    initial ? (MOCK_COMPANIES[initial] ?? null) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call
      // const res = await fetch(`/api/company/${encodeURIComponent(name)}`);
      // if (!res.ok) throw new Error("기업을 찾을 수 없어요");
      // const json: CompanyData = await res.json();
      // setData(json);

      // Mock: simulate network delay
      await new Promise((r) => setTimeout(r, 300));
      const mock = MOCK_COMPANIES[name];
      if (!mock) throw new Error("등록되지 않은 기업이에요. 다른 기업명을 입력해보세요.");
      setData(mock);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchCompany };
}
