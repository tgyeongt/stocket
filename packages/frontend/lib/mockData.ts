import type { CompanyData } from "@/types";

export const PRICE_MONTHS = [
  "24.05", "24.06", "24.07", "24.08", "24.09", "24.10",
  "24.11", "24.12", "25.01", "25.02", "25.03", "25.04",
];

export const MOCK_COMPANIES: Record<string, CompanyData> = {
  삼성전자: {
    name: "삼성전자",
    sector: "반도체",
    code: "005930",
    score: 87,
    grade: "성장 잠재력 매우 높음",
    axes: { growth: 92, stability: 81, profitability: 88, momentum: 85 },
    why: [
      {
        icon: "💪",
        title: "돈 버는 힘이 강해요",
        body: '최근 3년 평균 매출 성장률이 <strong class="text-green-400">반도체 업계 평균보다 18% 높아요</strong>. 꾸준히 수익을 만들어내고 있어요.',
      },
      {
        icon: "📉",
        title: "빚 부담이 줄고 있어요",
        body: '부채비율이 <strong class="text-green-400">3년 연속 감소</strong> 중이에요. 재무 체력이 점점 튼튼해지고 있어요.',
      },
      {
        icon: "🔄",
        title: "효율이 꾸준히 좋아지고 있어요",
        body: '자기자본이익률(ROE)이 <strong class="text-green-400">3년 평균 14.2%</strong>로 업계 최상위권이에요.',
      },
      {
        icon: "📊",
        title: "시장도 긍정적으로 보고 있어요",
        body: '주가가 최근 <strong class="text-green-400">60일 이동평균선 위</strong>에서 상승 추세를 유지하고 있어요.',
      },
    ],
    tags: [
      { label: "ROE", value: "14.2%" },
      { label: "영업이익률", value: "22.1%" },
      { label: "부채비율", value: "36.8%↓" },
      { label: "매출 CAGR", value: "+11.4%" },
      { label: "PER", value: "12.3x" },
    ],
    peers: [
      { name: "SK하이닉스", correlation: 95, score: 84 },
      { name: "Micron Technology", correlation: 88, score: 79 },
      { name: "Qualcomm", correlation: 81, score: 76 },
    ],
    simulation: { baseMarketRate: 8, baseTrend: 110 },
    priceHistory: [72, 68, 65, 69, 66, 71, 74, 73, 68, 71, 76, 79],
  },
  SK하이닉스: {
    name: "SK하이닉스",
    sector: "반도체",
    code: "000660",
    score: 84,
    grade: "성장 잠재력 높음",
    axes: { growth: 88, stability: 76, profitability: 84, momentum: 80 },
    why: [
      {
        icon: "💡",
        title: "HBM 시장을 선도해요",
        body: '고대역폭메모리(HBM) 시장에서 <strong class="text-green-400">글로벌 1위 점유율</strong>을 유지하고 있어요.',
      },
      {
        icon: "📈",
        title: "매출이 가파르게 오르고 있어요",
        body: '최근 1년 매출 성장률이 <strong class="text-green-400">+67%</strong>로 업계 최고 수준이에요.',
      },
      {
        icon: "🤖",
        title: "AI 반도체 수혜를 크게 받아요",
        body: '엔비디아에 HBM을 독점 공급하며 <strong class="text-green-400">AI 붐의 핵심 수혜주</strong>예요.',
      },
      {
        icon: "🏭",
        title: "설비 투자를 적극 늘리고 있어요",
        body: '미래 성장을 위한 <strong class="text-green-400">CAPEX가 업계 최상위권</strong>이에요.',
      },
    ],
    tags: [
      { label: "ROE", value: "18.5%" },
      { label: "영업이익률", value: "31.2%" },
      { label: "부채비율", value: "42.1%↓" },
      { label: "매출 CAGR", value: "+19.8%" },
      { label: "PER", value: "9.7x" },
    ],
    peers: [
      { name: "삼성전자", correlation: 95, score: 87 },
      { name: "Micron Technology", correlation: 91, score: 79 },
      { name: "TSMC", correlation: 72, score: 88 },
    ],
    simulation: { baseMarketRate: 12, baseTrend: 140 },
    priceHistory: [148, 155, 162, 150, 158, 170, 185, 178, 190, 205, 215, 228],
  },
  NAVER: {
    name: "NAVER",
    sector: "인터넷 서비스",
    code: "035420",
    score: 79,
    grade: "성장 잠재력 높음",
    axes: { growth: 76, stability: 85, profitability: 72, momentum: 82 },
    why: [
      {
        icon: "🛡",
        title: "빚은 줄고 안정성이 높아요",
        body: '부채비율이 <strong class="text-green-400">업계 평균의 절반 수준</strong>으로 매우 안전한 재무구조예요.',
      },
      {
        icon: "🛒",
        title: "커머스와 광고가 동시에 성장해요",
        body: '쇼핑과 광고 매출이 <strong class="text-green-400">두 자릿수 동반 성장</strong> 중이에요.',
      },
      {
        icon: "🌏",
        title: "일본 라인 사업이 성장엔진이에요",
        body: '라인야후를 통해 <strong class="text-green-400">일본 최대 메신저 플랫폼</strong>을 보유하고 있어요.',
      },
      {
        icon: "☁️",
        title: "클라우드 사업도 성장 중이에요",
        body: '네이버 클라우드가 <strong class="text-green-400">국내 시장 점유율 2위</strong>로 올라섰어요.',
      },
    ],
    tags: [
      { label: "ROE", value: "11.3%" },
      { label: "영업이익률", value: "15.8%" },
      { label: "부채비율", value: "22.4%" },
      { label: "매출 CAGR", value: "+8.9%" },
      { label: "PER", value: "22.1x" },
    ],
    peers: [
      { name: "카카오", correlation: 88, score: 65 },
      { name: "Kakao Pay", correlation: 72, score: 58 },
      { name: "크래프톤", correlation: 61, score: 72 },
    ],
    simulation: { baseMarketRate: 7, baseTrend: 105 },
    priceHistory: [198, 205, 195, 210, 218, 212, 225, 220, 215, 232, 240, 238],
  },
  카카오: {
    name: "카카오",
    sector: "인터넷 서비스",
    code: "035720",
    score: 65,
    grade: "성장 잠재력 보통",
    axes: { growth: 62, stability: 70, profitability: 58, momentum: 68 },
    why: [
      {
        icon: "🔁",
        title: "플랫폼 사업 회복 중이에요",
        body: '커머스와 광고 사업이 <strong class="text-green-400">점진적 회복세</strong>를 보이고 있어요.',
      },
      {
        icon: "💳",
        title: "카카오페이 금융 사업이 성장 중이에요",
        body: '핀테크 부문이 <strong class="text-green-400">연 20% 이상 성장</strong>하고 있어요.',
      },
      {
        icon: "🎨",
        title: "콘텐츠 수출이 늘고 있어요",
        body: '웹툰·게임의 <strong class="text-green-400">글로벌 진출이 가속화</strong>되고 있어요.',
      },
      {
        icon: "✂️",
        title: "비용 효율화가 진행 중이에요",
        body: '구조조정을 통해 <strong class="text-green-400">수익성 개선이 기대</strong>돼요.',
      },
    ],
    tags: [
      { label: "ROE", value: "4.2%" },
      { label: "영업이익률", value: "7.1%" },
      { label: "부채비율", value: "58.3%" },
      { label: "매출 CAGR", value: "+5.2%" },
      { label: "PER", value: "31.4x" },
    ],
    peers: [
      { name: "NAVER", correlation: 88, score: 79 },
      { name: "카카오페이", correlation: 76, score: 58 },
      { name: "카카오뱅크", correlation: 68, score: 62 },
    ],
    simulation: { baseMarketRate: 5, baseTrend: 95 },
    priceHistory: [48, 45, 43, 47, 50, 46, 44, 48, 51, 49, 52, 54],
  },
  LG에너지솔루션: {
    name: "LG에너지솔루션",
    sector: "2차전지",
    code: "373220",
    score: 82,
    grade: "성장 잠재력 높음",
    axes: { growth: 85, stability: 79, profitability: 80, momentum: 84 },
    why: [
      {
        icon: "🔋",
        title: "전기차 배터리 수요가 폭발적이에요",
        body: '글로벌 EV 배터리 시장에서 <strong class="text-green-400">점유율 2위</strong>를 유지하고 있어요.',
      },
      {
        icon: "📝",
        title: "장기 수주가 탄탄해요",
        body: '완성차 업체들과 <strong class="text-green-400">수백조원 규모 장기계약</strong>을 체결했어요.',
      },
      {
        icon: "🇺🇸",
        title: "북미 생산 기지를 적극 확대해요",
        body: '인플레감축법(IRA) 혜택으로 <strong class="text-green-400">북미 경쟁력이 급상승</strong>했어요.',
      },
      {
        icon: "⚡",
        title: "차세대 배터리 기술을 선도해요",
        body: '전고체 배터리 등 <strong class="text-green-400">차세대 기술 특허</strong>를 다수 보유하고 있어요.',
      },
    ],
    tags: [
      { label: "ROE", value: "12.8%" },
      { label: "영업이익률", value: "9.4%" },
      { label: "부채비율", value: "128.5%" },
      { label: "매출 CAGR", value: "+22.3%" },
      { label: "PER", value: "28.6x" },
    ],
    peers: [
      { name: "삼성SDI", correlation: 90, score: 78 },
      { name: "SK온", correlation: 82, score: 72 },
      { name: "CATL(중국)", correlation: 76, score: 88 },
    ],
    simulation: { baseMarketRate: 15, baseTrend: 130 },
    priceHistory: [390, 405, 385, 395, 410, 420, 415, 430, 440, 455, 465, 478],
  },
};

export const QUICK_CHIPS = ["삼성전자", "SK하이닉스", "NAVER", "카카오", "LG에너지솔루션"];
