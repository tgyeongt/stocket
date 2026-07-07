# 📈 Stocket

> 국내 주식 데이터를 기반으로 기업 재무정보와 주가를 한눈에 비교할 수 있는 주식 분석 서비스

🔗 **[stocket.site](https://stocket.site)**

---

## 주요 기능

- **기업 비교** — 복수의 기업을 선택해 재무지표·주가 데이터를 나란히 비교
- **재무제표 조회** — DART API 연동을 통한 상장 기업 재무 데이터 제공
- **주가 동기화** — 한국투자증권(KIS) API 기반 평일 실시간 주가 자동 업데이트
- **자동 데이터 파이프라인** — GitHub Actions 스케줄로 주가·재무 데이터 주기적 동기화

---

## 기술 스택

### Frontend

| 항목      | 기술         |
| --------- | ------------ |
| Framework | Next.js      |
| 배포      | Vercel       |
| 도메인    | stocket.site |

### Backend

| 항목          | 기술                |
| ------------- | ------------------- |
| Runtime       | Node.js             |
| ORM           | Prisma              |
| Database      | PostgreSQL (Docker) |
| 프로세스 관리 | PM2                 |
| 배포          | AWS EC2             |
| HTTPS         | Cloudflare Tunnel   |

### Data Pipeline

| 항목     | 기술                          |
| -------- | ----------------------------- |
| Language | Python 3 (pandas, SQLAlchemy) |
| 외부 API | DART, 한국투자증권(KIS)       |
| 스케줄링 | GitHub Actions (Cron)         |

> 상시 서버가 아니라 배치 전용입니다. GitHub Actions cron이 DART/KIS를 호출해 재무비율·주가지표·성장성 점수(growth/stability/profitability/momentum)를 pandas로 계산하고 Postgres에 저장합니다. Node 백엔드는 이 값을 재계산 없이 그대로 읽어 응답합니다.

### Infra & DevOps

| 항목          | 기술                          |
| ------------- | ----------------------------- |
| 모노레포      | Turborepo                     |
| CI/CD         | GitHub Actions (자동 배포)    |
| 네트워크 보안 | Cloudflare Tunnel             |
| 패키지 매니저 | Yarn Berry                    |

---

## 아키텍처

```
[사용자]
   │
   ▼
[Vercel] ── Next.js 프론트엔드 (stocket.site)
   │
   │ HTTPS API 요청
   ▼
[Cloudflare Tunnel] ── HTTPS 자동 적용
   │
   ▼
[AWS EC2]
   ├── Node.js 백엔드 (PM2, 3001 포트) — 유일한 API 서버
   └── PostgreSQL (Docker, 5433 포트)

[GitHub Actions]
   ├── CI: PR/push 시 lint & build 검증
   ├── CD: main push 시 EC2 자동 배포
   └── Data Sync: 주가·재무 데이터 자동 동기화
         └── SSH → EC2 → Python 스크립트 실행
```

---

## 모노레포 구조

```
stocket/
├── packages/
│   ├── frontend/   # Next.js 프론트엔드
│   ├── backend/    # Node.js API 서버
│   └── data/       # Python 데이터 파이프라인
├── .github/
│   └── workflows/
│       ├── ci.yml          # lint & build
│       ├── deploy.yml      # main push 시 EC2 자동 배포
│       └── data-sync.yml   # 데이터 동기화
└── turbo.json
```

---

## 데이터 아키텍처

Python(packages/data)은 상시 서버가 아니라 배치 전용입니다. 요청 시점에 실시간으로 외부 API를 호출하지 않고, GitHub Actions cron이 주기적으로 DART/KIS 데이터를 가져와 재무비율·주가지표·성장성 점수까지 미리 계산해 Postgres에 저장합니다.

- **계산은 Python, 응답은 Node**: growth/stability/profitability/momentum/overall 점수 공식은 `packages/data`의 `scoring_service.py` 한 곳에서만 계산되고, Node는 저장된 값을 Prisma로 읽어 그대로 응답합니다.
- **상장 기업 전체를 대상으로 동기화**: 인기 여부와 무관하게 코스피/코스닥/코넥스 전 종목을 배치가 주기적으로 갱신하므로, 별도의 응답 캐시나 인기 기업 우선순위 로직이 필요 없습니다.

## 데이터 동기화 스케줄

| 작업             | 주기                       | 설명                             |
| ---------------- | -------------------------- | -------------------------------- |
| 주가 동기화       | 평일 오전 7시 (KST)        | KIS API로 최신 주가·지표·점수 갱신 |
| 재무제표 동기화   | 매주 일요일 새벽 2시 (KST) | DART API로 재무 데이터·점수 갱신  |
| 업종코드 보완     | 매일 새벽 5시 (KST)        | indutyCode 없는 기업 DART 상세정보 보완 |

---

## 로컬 실행

### 사전 준비

- Node.js 22+
- Python 3.11+
- Docker


### 개발 서버 실행

```bash
# frontend + backend 동시 실행
yarn dev

# 개별 실행
yarn dev:frontend   # Next.js (frontend만)
yarn dev:backend    # ts-node-dev (backend만)
```

### 기타 명령어

```bash
# Prisma
yarn workspace backend db:generate   # 클라이언트 재생성
yarn workspace backend db:studio     # Prisma Studio 실행
yarn workspace backend db:migrate    # 마이그레이션 실행
```
