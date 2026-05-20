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
| 스케줄링 | GitHub Actions (Cron)   |

### Infra & DevOps

| 항목          | 기술              |
| ------------- | ----------------- |
| 모노레포      | Turborepo         |
| CI            | GitHub Actions    |
| 네트워크 보안 | Cloudflare Tunnel |
| 패키지 매니저 | npm Workspaces    |

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
   └── PostgreSQL (Docker, 5433 포트)

[GitHub Actions]
   ├── CI: PR/push 시 lint & build 검증
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
│       └── data-sync.yml   # 데이터 동기화
└── turbo.json
```

---

## 데이터 동기화 스케줄

| 작업            | 주기                       | 설명                            |
| --------------- | -------------------------- | ------------------------------- |
| 주가 동기화     | 평일 오전 7시 (KST)        | KIS API로 최신 주가 업데이트    |
| 재무제표 동기화 | 매주 일요일 새벽 2시 (KST) | DART API로 재무 데이터 업데이트 |

---

## 로컬 실행

### 사전 준비

- Node.js 22+
- Python 3.11+
- Docker

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp packages/backend/.env.example packages/backend/.env
cp packages/data/.env.example packages/data/.env

# DB 실행
docker run -d \
  --name stocket-db \
  -e POSTGRES_USER=stocket \
  -e POSTGRES_PASSWORD=stocket0916 \
  -e POSTGRES_DB=stocket \
  -p 5433:5432 \
  postgres:15

# DB 마이그레이션
cd packages/backend && npx prisma migrate deploy

# 전체 빌드
npx turbo build

# 백엔드 실행
cd packages/backend && node dist/index.js
```
