"use client";

import { useState, useCallback, useEffect } from "react";
import type { CompanyData } from "@/types";

interface UseCompanyReturn {
  data: CompanyData | null;
  loading: boolean;
  error: string | null;
  fetchCompany: (name: string) => Promise<void>;
}

export function useCompany(initial?: string): UseCompanyReturn {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/companies/by-name/${encodeURIComponent(name)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "기업을 찾을 수 없어요");
      }
      const body = await res.json();
      setData(body.data as CompanyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 기업명이 있으면 마운트 시 자동 조회
  useEffect(() => {
    if (initial) fetchCompany(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, fetchCompany };
}
