# Daily Budget Book — 구현 계획서

## 개요

매일 정해진 금액 안에서 지출을 기록하고, 남은 금액을 다음 날로 이월하는 개인별 예산 관리 앱.
여러 명이 함께 사용하며, 캘린더 형식의 UI로 월별 지출을 한눈에 확인할 수 있다.

---

## 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | API Routes로 서버 기능 포함 |
| 스타일링 | Tailwind CSS | |
| 인증 | NextAuth.js v5 (Credentials Provider) | 이메일 + 비밀번호 |
| ORM | Prisma | |
| DB | PostgreSQL | 배포 환경: Neon (무료 플랜, 정지 없음) |
| 언어 | TypeScript | |
| 암호화 | bcryptjs | 비밀번호 해싱 |
| 푸시 알림 | web-push | Web Push API (PWA 푸시 알림) |

---

## 데이터 모델 (Prisma Schema)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          Role      @default(MEMBER)  // ADMIN | MEMBER
  createdAt     DateTime  @default(now())

  spendings         Spending[]
  invites           Invite[]             @relation("InvitedBy")
  votes             BudgetChangeVote[]
  budgetRequests    BudgetChangeRequest[]
  savingGoals       SavingGoal[]
  pushSubscription  PushSubscription?
  notifications     Notification[]
}

model Invite {
  id          String    @id @default(cuid())
  token       String    @unique @default(cuid())
  email       String?                           // 특정 이메일 지정 (선택)
  invitedById String
  invitedBy   User      @relation("InvitedBy", fields: [invitedById], references: [id])
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}

model BudgetSetting {
  id            String    @id @default(cuid())
  amount        Int                             // 개인 일별 한도 (원 단위), 초기값 25000
  effectiveFrom DateTime                        // 적용 시작일
  status        BudgetStatus @default(PENDING)  // PENDING | ACTIVE | REJECTED
  createdAt     DateTime  @default(now())

  changeRequest BudgetChangeRequest?
}

model BudgetChangeRequest {
  id              String        @id @default(cuid())
  budgetSettingId String        @unique
  budgetSetting   BudgetSetting @relation(fields: [budgetSettingId], references: [id])
  requestedById   String
  requestedBy     User          @relation(fields: [requestedById], references: [id])
  createdAt       DateTime      @default(now())

  votes           BudgetChangeVote[]
}

model BudgetChangeVote {
  id        String              @id @default(cuid())
  requestId String
  request   BudgetChangeRequest @relation(fields: [requestId], references: [id])
  userId    String
  user      User                @relation(fields: [userId], references: [id])
  approved  Boolean
  votedAt   DateTime            @default(now())

  @@unique([requestId, userId])
}

model Spending {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Int                              // 지출 금액 (원 단위)
  memo      String
  date      DateTime                         // 지출 날짜 (시간은 무시, 날짜만 사용)
  createdAt DateTime @default(now())
}

model SavingGoal {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  title       String                         // 목표 이름 (예: "여행 경비")
  amount      Int                            // 목표 금액 (원 단위)
  achievedAt  DateTime?                      // 달성 시각 (null이면 미달성)
  createdAt   DateTime  @default(now())
}

model PushSubscription {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  subscription Json                          // Web Push subscription 객체
  createdAt    DateTime @default(now())

  @@unique([userId])                         // 기기당 1개 (갱신 방식)
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  message   String
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
}

enum Role {
  ADMIN
  MEMBER
}

enum BudgetStatus {
  PENDING
  ACTIVE
  REJECTED
}

enum NotificationType {
  GOAL_ACHIEVED   // 목표 금액 달성
  BUDGET_CHANGED  // 예산 한도 변경 승인
  VOTE_REQUESTED  // 예산 변경 투표 요청
}
```

---

## 잔액 계산 로직

개인별 독립 계산. 서버에서 동적으로 계산.

```
사용 가능 금액(오늘) = (오늘까지의 누적 예산) - (어제까지의 총 지출)

누적 예산 = 서비스 시작일부터 오늘까지의 일수 × 일별 한도
  * 한도가 중간에 변경된 경우 구간별로 합산

예시 (일별 한도 25,000원, 3일째):
  Day 1: 사용가능 25,000 / 지출 10,000 → 잔여 15,000
  Day 2: 사용가능 40,000 / 지출 40,000 → 잔여 0
  Day 3: 사용가능 25,000 / 지출 0     → 잔여 25,000
  Day 4: 사용가능 50,000
```

> 잔액은 무한정 이월. 한도 이상 지출 시 해당 일의 잔여는 0(음수 미처리).

---

## 페이지 구조

```
/                     로그인 페이지
/register?token=...   초대 링크로 접근하는 회원가입 페이지
/dashboard            메인 캘린더 뷰 (로그인 필요)
/dashboard/[date]     특정 날 지출 상세 및 추가
/settings             예산 한도 변경 요청 및 투표
/goals                목표 금액 설정 및 달성 현황
/admin/invites        초대 링크 생성 및 관리 (ADMIN 전용)
```

---

## API Routes

### 인증

| Method | 경로 | 기능 |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | NextAuth 로그인/로그아웃/세션 |
| POST | `/api/auth/register` | 회원가입 (초대 토큰 검증 후 계정 생성) |

### 초대 (ADMIN 전용)

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/admin/invites` | 초대 목록 조회 |
| POST | `/api/admin/invites` | 초대 링크 생성 (유효기간 설정 가능) |
| DELETE | `/api/admin/invites/[id]` | 초대 링크 삭제/무효화 |

### 지출

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/spending?date=YYYY-MM-DD&userId=` | 특정 날 특정 사용자 지출 목록 (전체 공개) |
| POST | `/api/spending` | 지출 추가 (amount, memo, date) |
| DELETE | `/api/spending/[id]` | 지출 삭제 (ADMIN 전용) |

### 캘린더

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/calendar?year=&month=` | 해당 월의 날짜별 지출 합계 + 잔액 데이터 |

### 예산

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/budget` | 현재 적용 중인 예산 한도 조회 |
| POST | `/api/budget/request` | 예산 변경 요청 생성 (새 금액 + 적용 시작일) |
| POST | `/api/budget/vote` | 변경 요청에 찬성/반대 투표 |

### 목표 금액

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/goals` | 본인 목표 목록 조회 |
| POST | `/api/goals` | 목표 생성 (title, amount) |
| DELETE | `/api/goals/[id]` | 목표 삭제 |

### 알림

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/notifications` | 본인 알림 목록 조회 |
| PATCH | `/api/notifications/[id]` | 알림 읽음 처리 |
| POST | `/api/push/subscribe` | Web Push 구독 등록 |
| DELETE | `/api/push/subscribe` | Web Push 구독 해제 |

### 사용자

| Method | 경로 | 기능 |
|---|---|---|
| GET | `/api/users` | 전체 사용자 목록 (투표 현황 표시용) |

---

## 주요 기능 상세

### 1. 캘린더 뷰 (`/dashboard`)

- 월 단위 캘린더, 이전/다음 달 이동 버튼
- 각 날짜 셀에 표시:
  - 해당일 **본인** 지출 합계 (메인 표시)
  - 해당일 **전체 사용자** 지출 합계 (서브 표시)
  - 오늘 셀: 오늘 사용 가능한 잔액 강조 표시 (본인 기준)
  - 과거 날짜: 지출 금액 / 지출 초과 시 빨간색 표시
- 날짜 클릭 → 해당 날 상세 페이지로 이동 (전체 지출 내역 공개)

### 2. 지출 상세 (`/dashboard/[date]`)

- 해당 날짜의 **전체 사용자** 지출 목록 (이름, 금액, 메모, 등록 시간)
- 사용자별로 그룹 또는 통합 리스트로 표시
- 지출 삭제 버튼: **ADMIN만** 노출 / 가능
- 지출 추가 폼 (금액 + 메모) — 본인 지출만 추가 가능
- 해당 날의 총 지출 / 사용 가능 금액 요약 표시 (본인 기준)

### 3. 예산 한도 변경 (`/settings`)

- 현재 적용 중인 한도 및 적용일 표시
- 대기 중인 변경 요청이 있을 경우: 투표 현황 표시 (누가 찬성/반대/미투표)
- 새 변경 요청 생성 폼 (새 금액 + 적용 시작일)
  - 대기 중 요청이 있으면 새 요청 불가
- 투표 버튼 (찬성 / 반대)
- **전원 찬성 시** 해당 날짜부터 자동 적용 (status: ACTIVE)
- **1명이라도 반대** 시 요청 거부 (status: REJECTED)

### 4. 관리자 초대 (`/admin/invites`)

- 초대 링크 생성 (유효기간: 기본 7일, **1회용** — 사용 즉시 무효화)
- 생성된 링크 복사 버튼
- 사용된 링크 / 만료된 링크 목록 관리 (사용 여부, 만료일 표시)
- 링크 수동 무효화 가능 (관리자가 삭제)
- 첫 번째 가입자가 자동으로 ADMIN 부여

### 5. 목표 금액 (`/goals`)

- 목표 목록: 이름, 목표 금액, 현재 누적 잔액, 달성률 프로그레스 바
- 목표 추가 폼 (이름 + 금액)
- 달성된 목표: 달성일 표시, 별도 섹션으로 구분
- 목표 삭제 가능

#### 알림 트리거 조건

지출 추가 / 삭제 시 서버에서 잔액을 재계산하여 아래 조건을 확인:

```
지출 변경 후 누적 잔액 >= 목표 금액
  AND 이전 누적 잔액 < 목표 금액
  AND 해당 목표가 아직 미달성(achievedAt == null)
  → 달성 처리(achievedAt 기록) + 알림 발송
```

#### 알림 발송 방식 (2중)

1. **인앱 알림** (항상): `Notification` 테이블에 저장 → 헤더 벨 아이콘에 읽지 않은 알림 뱃지
2. **Web Push** (선택): 사용자가 알림 허용 시 브라우저/PWA 푸시 알림 발송 (앱이 닫혀 있어도 수신)

#### 환경변수 추가 (web-push용)

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your@email.com
```

### 6. 회원가입 (`/register?token=...`)

- URL의 토큰 자동 검증
- 유효하지 않거나 만료된 토큰이면 에러 메시지
- 이름, 이메일, 비밀번호 입력 후 가입

---

## 디렉토리 구조

```
daily-budget-book/
├── app/
│   ├── (auth)/
│   │   ├── page.tsx              # 로그인
│   │   └── register/page.tsx     # 회원가입
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # 캘린더 뷰
│   │   │   └── [date]/page.tsx   # 날짜 상세
│   │   ├── settings/page.tsx     # 예산 설정
│   │   ├── goals/page.tsx        # 목표 금액 설정 및 현황
│   │   └── admin/
│   │       └── invites/page.tsx  # 초대 관리
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/register/route.ts
│       ├── spending/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── calendar/route.ts
│       ├── budget/
│       │   ├── route.ts
│       │   ├── request/route.ts
│       │   └── vote/route.ts
│       ├── users/route.ts
│       ├── goals/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── notifications/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── push/
│       │   └── subscribe/route.ts
│       └── admin/
│           └── invites/
│               ├── route.ts
│               └── [id]/route.ts
├── components/
│   ├── Calendar.tsx
│   ├── SpendingForm.tsx
│   ├── SpendingList.tsx
│   ├── BudgetVoteCard.tsx
│   ├── GoalCard.tsx
│   ├── NotificationBell.tsx
│   └── InviteManager.tsx
├── lib/
│   ├── auth.ts                   # NextAuth 설정
│   ├── prisma.ts                 # Prisma 클라이언트
│   ├── budget.ts                 # 잔액 계산 유틸
│   ├── push.ts                   # web-push 발송 유틸
│   └── goalCheck.ts              # 목표 달성 체크 + 알림 트리거
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # 초기 예산 설정(25,000원) 시드
├── .env.local
├── tailwind.config.ts
└── package.json
```

---

## 모바일 앱 대응

### 옵션 비교

| 방식 | 설명 | 추가 개발량 | 앱스토어 배포 |
|---|---|---|---|
| **PWA** (권장) | 웹 앱을 모바일 홈 화면에 설치 가능하게 전환 | 최소 (설정 파일 추가만) | 불가 (링크 공유) |
| **Capacitor** | 기존 Next.js 웹 앱을 네이티브 앱 껍데기로 감쌈 | 소규모 추가 작업 | 가능 (iOS/Android) |
| **React Native / Expo** | 별도 앱 코드베이스 작성, API만 공유 | 대규모 추가 작업 | 가능 |

### 권장 방향

**1단계: PWA로 구현** (이번 작업에 포함 가능)
- `manifest.json` + 서비스 워커 추가
- 홈 화면에 아이콘으로 설치 가능 (iOS Safari / Android Chrome)
- 반응형 UI (모바일 터치 최적화 레이아웃)
- 앱스토어 등록 불필요, 링크 공유로 설치
- 추가 비용 없음

**2단계: Capacitor로 네이티브 래핑** (필요 시 나중에)
- PWA 완성 후 Capacitor 추가 → iOS/Android 앱 빌드
- 기존 코드 변경 거의 없음
- App Store / Google Play 배포 가능

> **결론:** 이번 작업에 PWA 설정을 기본 포함. 나중에 앱스토어 배포가 필요하면 Capacitor 단계로 진행.

---

## 배포 계획

| 항목 | 선택지 |
|---|---|
| 앱 호스팅 | Vercel (Next.js 최적화, 무료 플랜 가능) |
| DB 호스팅 | Neon (PostgreSQL, 무료 플랜, 비활성 정지 없음) |
| 환경변수 | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |

---

## 초기 설정값 (Seed)

- 일별 예산 한도: **25,000원**
- 적용 시작일: 서비스 첫 실행일
- 첫 번째 가입자: 자동으로 ADMIN 역할 부여

---

## 확정된 결정 사항

| 항목 | 결정 |
|---|---|
| 지출 삭제 권한 | ADMIN만 가능 |
| 초대 링크 방식 | 1회용 (사용 즉시 무효화) |
| 타 사용자 지출 공개 | 전체 공개 (날짜 상세에서 모든 사용자 지출 표시) |
| 잔액 이월 | 무한정 이월 |
| 초기 일별 한도 | 25,000원 |
| 첫 가입자 권한 | 자동 ADMIN |
| 예산 변경 요청 재생성 | REJECTED 직후 바로 가능 |
| 목표 금액 알림 | 인앱 알림 + Web Push (PWA) |
