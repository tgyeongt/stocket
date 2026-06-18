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

| 항목     | 기술                    |
| -------- | ----------------------- |
| Language | Python 3                |
| 외부 API | DART, 한국투자증권(KIS) |
| 캐시     | Redis (Docker)          |
| API 서버 | FastAPI + Uvicorn       |
| 스케줄링 | GitHub Actions (Cron)   |

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
   ├── Node.js 백엔드 (PM2, 3001 포트)
   ├── FastAPI 데이터 서버 (PM2, 8000 포트)
   ├── PostgreSQL (Docker, 5433 포트)
   └── Redis (Docker, 6379 포트)

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

## 데이터 최적화 전략

DB에 모든 데이터를 저장하면 용량이 과다하고, 매번 실시간 API를 호출하면 느리다는 문제를 해결하기 위해 4가지 전략을 적용했습니다.

### 1. Redis 응답 캐시

`/company` 엔드포인트 응답을 Redis에 TTL 1시간으로 캐시합니다. 반복 조회 시 외부 API 호출 없이 즉시 반환합니다. Redis 연결 실패 시에도 캐시 없이 정상 동작합니다 (Graceful Degradation).

### 2. DART/KIS 병렬 호출

첫 조회(캐시 미스) 시 `asyncio.gather`로 4개 API 호출(기업정보, 당기 재무제표, 전기 재무제표, 주가)을 동시에 실행합니다. 기존 순차 호출 대비 약 50% 속도 개선.

### 3. Hot/Cold 데이터 분리

`lastAccessedAt` 컬럼으로 기업을 Hot(최근 30일 조회) / Cold(미조회)로 분류합니다.

- **Hot 기업**: 주가·재무 동기화 우선 대상
- **Cold 기업**: 매일 새벽 3시에 주가·지표 데이터 일괄 삭제 → DB 용량 70~80% 절감

### 4. Background Prefetch

평일 오전 7:30, 주가 동기화 직후 Hot 기업의 `/company` 응답을 사전 캐싱합니다. 인기 기업은 첫 조회도 빠르게 응답합니다.

---

## 데이터 동기화 스케줄

| 작업            | 주기                       | 설명                              |
| --------------- | -------------------------- | --------------------------------- |
| 주가 동기화     | 평일 오전 7시 (KST)        | KIS API로 최신 주가 업데이트      |
| 캐시 프리페치   | 평일 오전 7시 30분 (KST)   | Hot 기업 응답 사전 캐싱           |
| 재무제표 동기화 | 매주 일요일 새벽 2시 (KST) | DART API로 재무 데이터 업데이트   |
| Cold 데이터 정리 | 매일 새벽 3시 (KST)       | 30일 미조회 기업 주가·지표 삭제   |

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
