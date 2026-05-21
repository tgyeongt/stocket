"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import { useCompany } from "@/hooks/useCompany";
import CompareRadarChart from "@/components/charts/CompareRadarChart";
import ComparePriceChart from "@/components/charts/ComparePriceChart";
import SearchInput from "./components/SearchInput";
import CompanyCard from "./components/CompanyCard";
import MetricTable from "./components/MetricTable";
import { COLOR_A, COLOR_B } from "./constants";

export default function ComparePage() {
  const companyA = useCompany();
  const companyB = useCompany();
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");

  const canCompare = selectedA.trim() !== "" && selectedB.trim() !== "";
  const isLoading = companyA.loading || companyB.loading;

  function handleCompare() {
    if (!canCompare || isLoading) return;
    companyA.fetchCompany(selectedA);
    companyB.fetchCompany(selectedB);
  }

  const both = companyA.data && companyB.data;
  const anyError = companyA.error || companyB.error;

  return (
    <div className="max-w-[1100px] mx-auto px-3 pt-1 pb-20">
      <Header />

      <div className="mb-8">
        <Link href="/" className="text-[13px] text-[#94A3B8] hover:text-[#22C55E] transition-colors">
          ← 메인으로
        </Link>
        <h1 className="text-[22px] font-bold mt-3 mb-1">기업 비교</h1>
        <p className="text-[13px] text-[#94A3B8]">
          두 기업의 재무지표와 주가 흐름을 나란히 비교해보세요
        </p>
      </div>

      {/* 검색 */}
      <div className="flex items-end gap-3 sm:gap-5 mb-10">
        <SearchInput
          label="기업 A"
          color={COLOR_A}
          onSelect={setSelectedA}
          loading={companyA.loading}
        />
        <div className="shrink-0 flex items-center">
          <button
            onClick={handleCompare}
            disabled={!canCompare || isLoading}
            className={[
              "relative w-14 h-11 rounded-xl font-black text-[13px] tracking-widest transition-all duration-300 overflow-hidden",
              canCompare && !isLoading
                ? "cursor-pointer shadow-[0_0_16px_rgba(34,197,94,0.2),0_0_16px_rgba(59,130,246,0.2)]"
                : "cursor-not-allowed opacity-40",
            ].join(" ")}
            style={
              canCompare && !isLoading
                ? { background: "linear-gradient(135deg, #22C55E, #3B82F6)", color: "#fff" }
                : { background: "#1A1D27", color: "#475569", border: "1px solid #1E293B" }
            }
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              "VS"
            )}
          </button>
        </div>
        <SearchInput
          label="기업 B"
          color={COLOR_B}
          onSelect={setSelectedB}
          loading={companyB.loading}
        />
      </div>

      {anyError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 text-red-400 text-[13px] mb-6">
          {anyError}
        </div>
      )}

      {!both && !companyA.loading && !companyB.loading && (
        <div className="text-center py-24 text-[#475569] text-[15px]">
          두 기업을 검색하면 비교 결과가 나타납니다
        </div>
      )}

      {both && (
        <div className="flex flex-col gap-8">
          {/* 스코어 카드 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <CompanyCard company={companyA.data!} color={COLOR_A} />
            <CompanyCard company={companyB.data!} color={COLOR_B} />
          </div>

          {/* 레이더 차트 */}
          <div>
            <h2 className="text-[14px] font-semibold text-[#94A3B8] mb-3">4축 비교</h2>
            <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4">
              <CompareRadarChart a={companyA.data!} b={companyB.data!} />
            </div>
          </div>

          {/* 지표 테이블 */}
          <div>
            <h2 className="text-[14px] font-semibold text-[#94A3B8] mb-3">세부 지표</h2>
            <MetricTable a={companyA.data!} b={companyB.data!} />
          </div>

          {/* 주가 비교 */}
          <div>
            <h2 className="text-[14px] font-semibold text-[#94A3B8] mb-3">주가 흐름 비교</h2>
            <div className="bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5">
              <ComparePriceChart a={companyA.data!} b={companyB.data!} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
