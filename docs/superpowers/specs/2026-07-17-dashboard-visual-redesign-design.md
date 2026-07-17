# 메인 대시보드 비주얼 리디자인

## 배경

`packages/frontend`의 메인 대시보드(`app/page.tsx`와 그 하위 섹션들)가 "AI가 만든 티"가 난다는 피드백. 원인으로 지목된 두 가지:

1. **이모지를 아이콘처럼 사용** — 축 지표(🚀🛡💰📈), 로딩 스피너(⟳), 등급 배지(🚀) 등
2. **개성 없는 템플릿 레이아웃** — 모든 섹션이 `bg-[#1A1D27] border border-[rgba(255,255,255,0.07)] rounded-2xl`을 그대로 복붙한 카드이고, 히어로(점수 섹션)도 그라데이션 배경 + 2x2 미니바라는 흔한 패턴

## 방향 및 범위

- **톤/무드**: 다크 테마 + 그린 액센트(`#22C55E`) 정체성은 유지. 라이트 테마 전환이나 전면 리레이아웃은 하지 않음.
- **범위**: 메인 대시보드만 (`app/page.tsx`, `components/sections/*`, `components/ui/*`, 관련 차트 wrapper). `/compare` 페이지와 `MetricTable`의 🏆은 이번 범위 밖.
- **의존성**: 새 npm 패키지 추가 없음. 아이콘은 인라인 SVG로 직접 작성.

## 디자인 토큰

`app/globals.css`에 Tailwind v4 `@theme` 블록으로 색상 토큰 도입. 지금 컴포넌트마다 흩어진 하드코딩 값을 다음으로 치환:

| 토큰 | 값 | 대체하는 기존 하드코딩 |
|---|---|---|
| `--color-bg` | `#0f1117` | `body` 배경 |
| `--color-surface` | `#1A1D27` | 카드 배경 (`bg-[#1A1D27]`) |
| `--color-surface-alt` | `#22263A` | 보조 배경 (`bg-[#22263A]`, 프로그레스 바 트랙) |
| `--color-border` | `rgba(255,255,255,0.07)` | 카드 테두리 |
| `--color-text` | `#F1F5F9` | 기본 텍스트 |
| `--color-text-muted` | `#94A3B8` | 보조 텍스트 |
| `--color-text-faint` | `#475569` | placeholder/약한 텍스트 |
| `--color-accent` | `#22C55E` | 그린 액센트 |
| `--color-accent-soft` | `rgba(34,197,94,0.12)` | 그린 톤 배경/보더 |

기존 컴포넌트의 `text-[#94A3B8]` 같은 임의값 클래스들을 토큰 기반 유틸(`text-muted` 등)으로 점진 치환. 전수 치환이 diff를 과도하게 키우면, 이번 라운드에서 손대는 파일(아래 컴포넌트 목록)만 우선 정리.

## 공용 컴포넌트

### `components/ui/Card.tsx` (신규)
5개 섹션(`ScoreSection` 제외 — 히어로는 별도 처리)에 반복되는 카드 래퍼를 하나로 통합.

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
```
내부는 `bg-surface border border-border rounded-2xl`. `SimulationSection`, `PeerSection`, `PriceSection`, `ExplainSection`의 카드 div를 이걸로 교체.

### `components/icons/` (신규)
4개 축 아이콘을 라인 SVG React 컴포넌트로: `GrowthIcon`, `StabilityIcon`, `ProfitabilityIcon`, `MomentumIcon`. 16~18px, `stroke="currentColor"`, `stroke-width={2}`로 텍스트 색과 동일 계열 유지.

### `components/ui/SectionLabel.tsx` (수정)
번호 원형 배지(`①②③`) 제거. 승인된 안(그린 좌측 바 3×14px + 대문자 트래킹 텍스트)으로 교체. `step: number` prop 제거.

```tsx
interface SectionLabelProps {
  children: React.ReactNode;
}
```

`components/sections/Section.tsx`도 `step` prop 제거하고 그대로 전달.

## 히어로 — `ScoreSection.tsx` 재구성

브레인스토밍에서 확정한 조합(B: 게이지 헤더 + A: 4분할 축 카드):

- 배경: 기존 `linear-gradient(135deg, #1A2A1A 0%, #1A1D27 60%)` 그라데이션 제거. 페이지 배경과 동일한 `bg-bg` + `border border-border` 헤어라인만 사용 (다른 카드와 차별화는 크기/타이포로, 배경 그라데이션으로 하지 않음).
- 상단: 라디얼 게이지(기존 `GaugeChart` 스타일 유지, 크기 축소 ~86px) + 기업명/섹터/종목코드 + 등급 배지. 등급 배지는 이모지 없이 텍스트 + 보더만.
- 구분선: 1px 헤어라인.
- 하단: 4분할 그리드. 각 칸 = 아이콘(신규 SVG) + 라벨 + 값(숫자) + 2px 두께 프로그레스 바. 기존 2x2 미니 카드(`bg-[rgba(255,255,255,0.02)]`) 배경은 제거하고 플랫하게.

## 기타 변경

- `app/page.tsx`의 로딩 스피너: `<span className="animate-spin">⟳</span>` → CSS 보더 기반 스피너(`border-2 border-t-transparent rounded-full animate-spin`)로 교체. 유니코드 문자 재사용 패턴 제거.

## 범위 밖 (의도적으로 유지)

- `ExplainSection`의 `card.icon`은 백엔드 데이터(`company.why[].icon`)에서 내려오는 이모지 문자열 — 프론트 전용 작업으로는 못 바꿈. 이번엔 그대로 둠.
- `/compare` 페이지, `MetricTable`의 🏆.

## 검증

새 코드 작성 전 `packages/frontend/node_modules/next/dist/docs/`에서 Next.js 16 / React 19 관련 breaking change 여부 확인 (`AGENTS.md` 지시사항). 구현 후 `/run`으로 dev 서버에서 실제 화면 확인:
- 기본 로드(삼성전자), 로딩 상태, 에러 상태(존재하지 않는 기업 검색)
- 모바일 너비에서 4분할 그리드/헤더 줄바꿈
- 다른 섹션(시뮬레이션/설명/피어/주가)이 새 `Card`로도 기존과 동일하게 보이는지
