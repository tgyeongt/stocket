"use client";

import { useState } from "react";
import { useCompany } from "@/hooks/useCompany";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import SearchSection from "@/components/sections/SearchSection";
import ScoreSection from "@/components/sections/ScoreSection";
import SimulationSection from "@/components/sections/SimulationSection";
import ExplainSection from "@/components/sections/ExplainSection";
import PeerSection from "@/components/sections/PeerSection";
import PriceSection from "@/components/sections/PriceSection";

const DEFAULT_COMPANY = "삼성전자";

export default function Home() {
  const [activeChip, setActiveChip] = useState(DEFAULT_COMPANY);
  const { data, loading, error, fetchCompany } = useCompany(DEFAULT_COMPANY);

  async function handleSearch(name: string) {
    if (!name) return;
    setActiveChip(name);
    await fetchCompany(name);
  }

  return (
    <div className="max-w-[1100px] mx-auto px-3 pt-1 pb-8 pb-20">
      <Header />
      <SearchSection
        onSearch={handleSearch}
        loading={loading}
        activeChip={activeChip}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-[#94A3B8] text-[15px]">
          <span className="animate-spin text-green-400">⟳</span>
          분석 중이에요…
        </div>
      )}

      {!loading && data && (
        <div className="flex flex-col gap-[40px]">
          <ScoreSection company={data} />
          <SimulationSection company={data} />
          <ExplainSection company={data} />
          <PeerSection company={data} />
          <PriceSection company={data} />
        </div>
      )}

      <Footer />
    </div>
  );
}
