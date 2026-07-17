# 메인 대시보드 비주얼 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `packages/frontend`의 메인 대시보드(app/page.tsx + components/sections/*)에서 이모지 아이콘과 반복되는 템플릿 카드 레이아웃을 제거하고, 다크+그린 정체성은 유지한 채 디테일을 정리한다.

**Architecture:** Tailwind v4 `@theme` 토큰을 globals.css에 추가하고, 반복되는 카드 래퍼를 `Card` 컴포넌트로, 이모지 축 아이콘을 인라인 SVG 컴포넌트로 대체한다. `ScoreSection`(히어로)을 게이지+4분할 축 카드 레이아웃으로 재구성하고, `SectionLabel`에서 번호 배지를 제거한다.

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS v4. 새 npm 패키지 추가 없음.

## Global Constraints

- 새 의존성 추가 금지 (스펙 명시)
- 다크 테마(`#0f1117` 배경) + 그린 액센트(`#22C55E`) 정체성 유지
- 범위는 메인 대시보드만: `app/page.tsx`, `components/sections/*`, `components/ui/*`. `/compare` 페이지와 `ExplainSection`의 `card.icon`(백엔드 데이터)은 건드리지 않음
- `packages/frontend`에는 컴포넌트 테스트 러너가 없음(package.json에 jest/vitest/testing-library 없음). 각 태스크의 검증은 `npx tsc --noEmit`(타입 체크) + `yarn lint`로 대체하고, 최종 태스크에서 실행 중인 dev 서버로 수동 시각 확인한다. 새 테스트 프레임워크는 추가하지 않는다(스펙의 "새 패키지 추가 없음" 제약과 충돌).
- 참고: `packages/frontend/AGENTS.md`에 "이 Next.js는 학습 데이터와 다를 수 있다"는 경고가 있음 — 이번 작업은 기존 컴포넌트 패턴(함수형 컴포넌트, `"use client"`)을 그대로 따르므로 새 API를 도입하지 않아 리스크 낮음.

---

## File Structure

**신규:**
- `components/ui/Card.tsx` — 반복되는 카드 래퍼 (`bg-surface border border-border rounded-2xl`)
- `components/icons/axis-icons.tsx` — 4개 축(성장성/안정성/수익성/모멘텀) 라인 SVG 아이콘

**수정:**
- `app/globals.css` — `@theme` 토큰 추가
- `components/ui/SectionLabel.tsx` — 번호 배지 제거, 그린 바 스타일
- `components/sections/Section.tsx` — `step` prop 제거
- `components/sections/ScoreSection.tsx` — 히어로 레이아웃 재구성
- `components/sections/SimulationSection.tsx` — `Card` 적용, `step` 제거, 토큰 적용
- `components/sections/PeerSection.tsx` — `Card` 적용, `step` 제거, 토큰 적용
- `components/sections/PriceSection.tsx` — `Card` 적용, `step` 제거
- `components/sections/ExplainSection.tsx` — `step` 제거, 토큰 적용 (Card는 적용 안 함 — 이 섹션의 카드는 outer wrapper가 아니라 작은 그리드 아이템이라 rounded-2xl 패턴과 다름)
- `app/page.tsx` — 로딩 스피너 CSS화

---

### Task 1: 디자인 토큰

**Files:**
- Modify: `packages/frontend/app/globals.css` (전체)

**Interfaces:**
- Produces: Tailwind 유틸리티 클래스 `bg-bg`, `bg-surface`, `bg-surface-alt`, `border-border`, `text-fg`, `text-muted`, `text-faint`, `text-accent`/`bg-accent`/`border-accent`, `bg-accent-soft`. `.spinner` 클래스 (Task 8에서 사용).

- [ ] **Step 1: globals.css 전체 교체**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0f1117;
  --color-surface: #1A1D27;
  --color-surface-alt: #22263A;
  --color-border: rgba(255, 255, 255, 0.07);
  --color-fg: #F1F5F9;
  --color-muted: #94A3B8;
  --color-faint: #475569;
  --color-accent: #22C55E;
  --color-accent-soft: rgba(34, 197, 94, 0.12);
}

@font-face {
  font-family: "Pretendard Variable";
  src: url("https://cdn.jsdelivr.net/gh/Project-Noonnu/noonfonts_2107@1.1/Pretendard-Variable.woff2")
    format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: "Pretendard", sans-serif;
  background: var(--color-bg);
  color: var(--color-fg);
  min-height: 100vh;
  padding: 10px 20px;
}

input[type="range"] {
  accent-color: var(--color-accent);
}

canvas {
  display: block;
}

.why-highlight {
  color: var(--color-accent);
  font-weight: 600;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 2: 타입/린트 확인**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 에러 없음 (globals.css는 타입체크 대상 아니므로 기존과 동일하게 통과해야 함)

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/app/globals.css
git commit -m "Style: 디자인 토큰(@theme) 도입"
```

---

### Task 2: 공용 Card 컴포넌트

**Files:**
- Create: `packages/frontend/components/ui/Card.tsx`

**Interfaces:**
- Produces: `Card` 컴포넌트 — `import Card from "@/components/ui/Card"`. Props: `{ children: React.ReactNode; className?: string }`.

- [ ] **Step 1: Card.tsx 작성**

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface border border-border rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 타입 확인**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/components/ui/Card.tsx
git commit -m "Feat: 공용 Card 컴포넌트 추가"
```

---

### Task 3: 축 아이콘 세트

**Files:**
- Create: `packages/frontend/components/icons/axis-icons.tsx`

**Interfaces:**
- Produces: `GrowthIcon`, `StabilityIcon`, `ProfitabilityIcon`, `MomentumIcon` — 각각 `{ className?: string }` props를 받는 SVG 컴포넌트. `import { GrowthIcon, StabilityIcon, ProfitabilityIcon, MomentumIcon } from "@/components/icons/axis-icons"`.

- [ ] **Step 1: axis-icons.tsx 작성**

```tsx
interface AxisIconProps {
  className?: string;
}

export function GrowthIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function StabilityIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </svg>
  );
}

export function ProfitabilityIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10a2.5 2.5 0 0 1 2.5-1.5c1.4 0 2.5.8 2.5 2s-1 1.5-2.5 1.5S9 12.8 9 14s1.1 2 2.5 2a2.5 2.5 0 0 0 2.5-1.5" />
    </svg>
  );
}

export function MomentumIcon({ className = "" }: AxisIconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}
```

- [ ] **Step 2: 타입 확인**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/components/icons/axis-icons.tsx
git commit -m "Feat: 축 지표 라인 SVG 아이콘 추가"
```

---

### Task 4: SectionLabel / Section — 번호 배지 제거

**Files:**
- Modify: `packages/frontend/components/ui/SectionLabel.tsx` (전체)
- Modify: `packages/frontend/components/sections/Section.tsx` (전체)

**Interfaces:**
- Consumes: 없음 (독립 컴포넌트)
- Produces: `SectionLabel` props `{ children: React.ReactNode }` (기존 `step: number` 제거). `Section` props `{ label: string; children: React.ReactNode }` (기존 `step: number`, `className?: string`(미사용이었음) 제거).

- [ ] **Step 1: SectionLabel.tsx 교체**

```tsx
interface SectionLabelProps {
  children: React.ReactNode;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="w-[3px] h-[14px] bg-accent rounded-full flex-shrink-0" />
      <span className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
        {children}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Section.tsx 교체**

```tsx
import SectionLabel from "@/components/ui/SectionLabel";

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

export default function Section({ label, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-[20px]">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  );
}
```

**주의:** 이 시점에서 `Section`을 사용하는 5개 섹션 컴포넌트가 여전히 `step={N}` prop을 넘기고 있어 `npx tsc --noEmit`이 실패한다. Task 5~7에서 각 사용처를 고치면서 해소된다 — 지금은 실패가 정상이다.

- [ ] **Step 3: 타입 확인 (실패 예상)**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: `Property 'step' does not exist on type 'SectionProps'` 에러가 `ScoreSection.tsx`, `SimulationSection.tsx`, `ExplainSection.tsx`, `PeerSection.tsx`, `PriceSection.tsx` 5곳에서 발생

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/components/ui/SectionLabel.tsx packages/frontend/components/sections/Section.tsx
git commit -m "Style: SectionLabel에서 번호 배지 제거, 그린 바 스타일로 교체"
```

---

### Task 5: ScoreSection 히어로 재구성

**Files:**
- Modify: `packages/frontend/components/sections/ScoreSection.tsx` (전체)

**Interfaces:**
- Consumes: `Section` (Task 4, `{ label, children }`), `GrowthIcon`/`StabilityIcon`/`ProfitabilityIcon`/`MomentumIcon` (Task 3), 기존 `GaugeChart`(`{ score: number }`, 변경 없음)
- Produces: 없음 (leaf 컴포넌트)

- [ ] **Step 1: ScoreSection.tsx 교체**

```tsx
import type { CompanyData } from "@/types";
import GaugeChart from "@/components/charts/GaugeChart";
import Section from "@/components/sections/Section";
import {
  GrowthIcon,
  StabilityIcon,
  ProfitabilityIcon,
  MomentumIcon,
} from "@/components/icons/axis-icons";

const AXIS_META = [
  { key: "growth" as const, Icon: GrowthIcon, label: "성장성" },
  { key: "stability" as const, Icon: StabilityIcon, label: "안정성" },
  { key: "profitability" as const, Icon: ProfitabilityIcon, label: "수익성" },
  { key: "momentum" as const, Icon: MomentumIcon, label: "시장 모멘텀" },
];

interface ScoreSectionProps {
  company: CompanyData;
}

export default function ScoreSection({ company }: ScoreSectionProps) {
  return (
    <Section label="성장 가능성 점수">
      <div className="rounded-[20px] p-6 sm:p-8 border border-border mb-[36px]">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 mb-6">
          <GaugeChart score={company.score} />

          <div className="w-full sm:flex-1">
            <h2 className="text-[26px] font-bold tracking-[-0.5px] mb-1">
              {company.name}
            </h2>
            <p className="text-[13px] text-muted mb-4">
              {company.sector} · 코스피 {company.code}
            </p>
            <div className="inline-flex items-center border border-accent/30 rounded-lg px-4 py-2">
              <span className="text-[14px] font-semibold text-accent">
                {company.grade}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border mb-6" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {AXIS_META.map(({ key, Icon, label }) => {
            const val = company.axes[key];
            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-2 text-muted">
                  <Icon className="flex-shrink-0" />
                  <span className="text-[11px]">{label}</span>
                </div>
                <div className="text-[18px] font-semibold mb-1.5">{val}</div>
                <div className="h-[2px] bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-[width] duration-1000 ease-out"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: 타입 확인**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: `ScoreSection.tsx` 관련 에러 없음 (다른 4개 섹션의 `step` 에러는 아직 남아있음 — 정상)

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/components/sections/ScoreSection.tsx
git commit -m "Style: ScoreSection 히어로를 게이지+축카드 레이아웃으로 재구성, 이모지 제거"
```

---

### Task 6: SimulationSection / PeerSection / PriceSection — Card 적용

**Files:**
- Modify: `packages/frontend/components/sections/SimulationSection.tsx` (전체)
- Modify: `packages/frontend/components/sections/PeerSection.tsx` (전체)
- Modify: `packages/frontend/components/sections/PriceSection.tsx` (전체)

**Interfaces:**
- Consumes: `Card` (Task 2, `{ children, className? }`), `Section` (Task 4, `{ label, children }`)
- Produces: 없음 (leaf 컴포넌트)

- [ ] **Step 1: SimulationSection.tsx 교체**

```tsx
"use client";

import { useState } from "react";
import type { CompanyData } from "@/types";
import { calcSimulation } from "@/lib/simulation";
import SimulationChart from "@/components/charts/SimulationChart";
import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";
import FinTag from "@/components/ui/FinTag";

interface SimulationSectionProps {
  company: CompanyData;
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full border border-faint text-faint text-[10px] flex items-center justify-center hover:border-muted hover:text-muted transition-colors cursor-help"
        aria-label="설명 보기"
      >
        ?
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[230px] bg-bg border border-[rgba(255,255,255,0.12)] rounded-[8px] px-3 py-2.5 text-[11px] text-muted leading-[1.6] z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-none whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[rgba(255,255,255,0.12)]" />
        </span>
      )}
    </span>
  );
}

function fmtRate(v: number | null | undefined): string {
  if (v == null) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export default function SimulationSection({ company }: SimulationSectionProps) {
  const [prevCode, setPrevCode] = useState(company.code);
  const [marketRate, setMarketRate] = useState(company.simulation.baseMarketRate);
  const [trend, setTrend] = useState(company.simulation.baseTrend);

  if (prevCode !== company.code) {
    setPrevCode(company.code);
    setMarketRate(company.simulation.baseMarketRate);
    setTrend(company.simulation.baseTrend);
  }

  const sim = calcSimulation(marketRate, trend);

  const marketRateTooltip =
    company.simulation.revenueGrowthRate != null
      ? `전년도 매출 YoY 성장률(${fmtRate(company.simulation.revenueGrowthRate)})을 기반으로 설정됐어요. 0~30% 범위로 조정되며, 슬라이더로 다양한 시장 시나리오를 탐색할 수 있어요.`
      : `해당 기업의 전년도 매출 성장률을 기반으로 설정됩니다 (데이터 없을 시 기본값 7%). 슬라이더로 다양한 시장 시나리오를 탐색할 수 있어요.`;

  const trendTooltip =
    company.simulation.momentum6m != null
      ? `최근 6개월 주가 수익률(${fmtRate(company.simulation.momentum6m)})을 기반으로 설정됐어요. 100이 현재 성장세 유지, 100 초과는 가속 성장, 미만은 성장 둔화를 의미해요.`
      : `최근 6개월 주가 모멘텀을 기반으로 설정됩니다 (데이터 없을 시 기본값 100%). 100이 현재 성장세 유지, 높을수록 강한 성장세를 의미해요.`;

  return (
    <Section label="미래 성장 시뮬레이션">
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-6 pb-2">
          <div>
            <h3 className="text-[17px] font-semibold">성장 시나리오 시뮬레이터</h3>
            <p className="text-[12px] text-muted mt-[3px]">슬라이더를 조정해 다양한 시장 상황의 성장 예측을 확인하세요</p>
          </div>
          <FinTag label="기준:" value={`${company.simulation.dataYear ?? new Date().getFullYear() - 1}년 매출`} />
        </div>

        <div className="flex items-center gap-3.5 mb-4 px-1 py-1.5">
          <span className="text-[13px] text-muted whitespace-nowrap min-w-[90px] flex items-center">
            시장 성장률
            <InfoTooltip text={marketRateTooltip} />
          </span>
          <input type="range" min={2} max={25} step={1} value={marketRate} onChange={(e) => setMarketRate(Number(e.target.value))} className="flex-1" />
          <span className="text-[14px] font-semibold text-accent min-w-[44px] text-right">{marketRate}%</span>
        </div>

        <div className="flex items-center gap-3.5 mb-6 px-1 py-1.5">
          <span className="text-[13px] text-muted whitespace-nowrap min-w-[90px] flex items-center">
            현재 성장세
            <InfoTooltip text={trendTooltip} />
          </span>
          <input type="range" min={50} max={150} step={1} value={trend} onChange={(e) => setTrend(Number(e.target.value))} className="flex-1" />
          <span className="text-[14px] font-semibold text-accent min-w-[44px] text-right">{trend}%</span>
        </div>

        <div className="grid grid-cols-3 gap-3.5 mb-5">
          {[
            { label: "1년 후", value: sim.year1 },
            { label: "3년 후", value: sim.year3 },
            { label: "5년 후", value: sim.year5 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-alt rounded-[12px] p-4 text-center">
              <p className="text-[11px] text-muted mb-1.5">{label}</p>
              <p className="text-[22px] font-bold text-accent">+{value}%</p>
            </div>
          ))}
        </div>

        <SimulationChart data={sim.chartData} />
      </Card>
    </Section>
  );
}
```

- [ ] **Step 2: PeerSection.tsx 교체**

```tsx
import type { CompanyData } from "@/types";
import BubbleChart from "@/components/charts/BubbleChart";
import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";

interface PeerSectionProps {
  company: CompanyData;
}

export default function PeerSection({ company }: PeerSectionProps) {
  if (company.peers.length === 0) {
    return (
      <Section label="유사 기업 비교 — 같은 업종 · 비슷한 성장 패턴">
        <Card className="p-6 mb-6 text-center">
          <p className="text-[14px] font-semibold mb-1.5">
            아직 비교할 유사 기업이 없어요
          </p>
          <p className="text-[13px] text-muted">
            같은 업종으로 등록된 다른 기업 데이터가 아직 충분하지 않아요. 데이터가 쌓이면 표시될 예정이에요.
          </p>
        </Card>
      </Section>
    );
  }

  return (
    <Section label="유사 기업 비교 — 같은 업종 · 비슷한 성장 패턴">
      <Card className="p-6 mb-[36px]">
        <p className="text-[13px] text-muted mb-4">
          같은 업종 기업 중 성장 패턴이 비슷할수록 중심에 가깝게 표시돼요
        </p>
        <div className="relative w-full h-[300px]">
          <BubbleChart
            centerName={company.name}
            centerScore={company.score}
            peers={company.peers}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        {company.peers.map((peer) => (
          <div
            key={peer.name}
            className="bg-surface border border-border rounded-[12px] px-5 py-[18px]"
          >
            <p className="text-[12px] text-muted mb-1.5">
              성장 패턴 유사도 {peer.correlation}%
            </p>
            <p className="text-[15px] font-semibold mb-1">{peer.name}</p>
            <div className="flex gap-2 items-center pt-0.5">
              <span className="text-[12px] text-muted">성장성 점수</span>
              <span className="text-[14px] font-semibold text-accent">
                {peer.score}점
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: PriceSection.tsx 교체**

```tsx
import type { CompanyData } from "@/types";
import PriceChart from "@/components/charts/PriceChart";
import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";

interface PriceSectionProps {
  company: CompanyData;
}

export default function PriceSection({ company }: PriceSectionProps) {
  return (
    <Section label="주가 추이">
      <Card className="mb-[36px]">
        <PriceChart prices={company.priceHistory} companyName={company.name} />
      </Card>
    </Section>
  );
}
```

- [ ] **Step 4: 타입 확인**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 3개 파일 관련 에러 없음 (`ExplainSection.tsx`의 `step` 에러만 남아있음 — 정상)

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/components/sections/SimulationSection.tsx packages/frontend/components/sections/PeerSection.tsx packages/frontend/components/sections/PriceSection.tsx
git commit -m "Refactor: Simulation/Peer/PriceSection에 공용 Card 적용"
```

---

### Task 7: ExplainSection — step 제거 + 토큰 적용

**Files:**
- Modify: `packages/frontend/components/sections/ExplainSection.tsx` (전체)

**Interfaces:**
- Consumes: `Section` (Task 4, `{ label, children }`)
- Produces: 없음 (leaf 컴포넌트)

- [ ] **Step 1: ExplainSection.tsx 교체**

```tsx
import type { CompanyData, WhySegment } from "@/types";
import Section from "@/components/sections/Section";
import FinTag from "@/components/ui/FinTag";

interface ExplainSectionProps {
  company: CompanyData;
}

const TONE_CLASS: Record<NonNullable<WhySegment["tone"]>, string> = {
  positive: "text-green-400",
  warning: "text-yellow-400",
  negative: "text-red-400",
};

export default function ExplainSection({ company }: ExplainSectionProps) {
  return (
    <Section label="왜 이런 성장세를 보이는가?">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-[10px]">
        {company.why.map((card, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-[12px] px-[18px] py-4 flex gap-3 items-start"
          >
            <div className="w-9 h-9 rounded-[10px] bg-accent-soft flex items-center justify-center flex-shrink-0 text-[17px]">
              {card.icon}
            </div>
            <div className="pt-0.5">
              <strong className="block text-[13px] font-semibold mb-1">
                {card.title}
              </strong>
              <span className="text-[12px] text-muted leading-[1.5]">
                {card.segments.map((segment, j) =>
                  segment.tone ? (
                    <strong key={j} className={TONE_CLASS[segment.tone]}>
                      {segment.text}
                    </strong>
                  ) : (
                    <span key={j}>{segment.text}</span>
                  ),
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 flex-wrap mb-10">
        {company.tags.map((tag) => (
          <FinTag key={tag.label} label={tag.label} value={tag.value} />
        ))}
      </div>
    </Section>
  );
}
```

**참고:** `card.icon`(이모지)은 `company.why[]`에서 백엔드가 내려주는 데이터 — 스펙상 이번 범위 밖이라 그대로 둔다.

- [ ] **Step 2: 타입 확인 (전체 통과 예상)**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 에러 없음 (Task 4에서 발생했던 5개 `step` 에러가 모두 해소됨)

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/components/sections/ExplainSection.tsx
git commit -m "Refactor: ExplainSection에서 step prop 제거, 토큰 적용"
```

---

### Task 8: 로딩 스피너 + 최종 검증

**Files:**
- Modify: `packages/frontend/app/page.tsx:36-41`

**Interfaces:**
- Consumes: `.spinner` CSS 클래스 (Task 1)

- [ ] **Step 1: 로딩 블록 교체**

기존 (`app/page.tsx` 36-41행):
```tsx
      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-[#94A3B8] text-[15px]">
          <span className="animate-spin text-green-400">⟳</span>
          분석 중이에요…
        </div>
      )}
```

교체 후:
```tsx
      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-muted text-[15px]">
          <span className="spinner" />
          분석 중이에요…
        </div>
      )}
```

- [ ] **Step 2: 전체 타입/린트 확인**

Run: `cd packages/frontend && npx tsc --noEmit && yarn lint`
Expected: 에러 없음

- [ ] **Step 3: dev 서버로 스모크 확인**

dev 서버(포트 3000)는 이미 실행 중. 저장 후 Fast Refresh가 반영되면:

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`

Run: `curl -s http://localhost:3000/ | grep -c "기업을 찾을 수 없"`
Expected: `0` (기본 기업(삼성전자) 로드 성공 시 에러 문구가 없어야 함)

- [ ] **Step 4: 수동 시각 확인**

브라우저에서 `http://localhost:3000` 새로고침 후 확인:
- 히어로 섹션에 이모지 없이 게이지+축카드 4분할이 보이는지
- 섹션 레이블에 번호 원 대신 그린 바가 보이는지
- 검색 중 로딩 스피너가 CSS 스피너로 도는지
- 모바일 너비(예: 375px)에서 히어로 4분할 그리드가 2열로 줄바꿈되는지 (`sm:grid-cols-4` → 기본 `grid-cols-2`)

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/app/page.tsx
git commit -m "Style: 로딩 스피너를 CSS 기반으로 교체"
```
