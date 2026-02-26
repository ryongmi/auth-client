# Auth Client

> KRGeobuk 생태계의 중앙 인증 서비스

`auth.krgeobuk.com`에서 서비스되는 독립적인 인증 클라이언트로, 모든 krgeobuk 서비스의 SSO(Single Sign-On) 허브 역할을 담당합니다.

---

## 주요 기능

### 인증 시스템
- **일반 로그인/회원가입** - 이메일 기반 사용자 인증
- **OAuth 로그인** - Google, Naver 소셜 로그인
- **SSO 허브** - krgeobuk 서비스 간 seamless 인증 연동
- **비밀번호 관리** - 찾기/재설정 이메일 발송
- **이메일 인증** - 회원가입 후 이메일 인증 및 재전송

### 계정 관리
- **OAuth 계정 연동/해제** - 소셜 계정 관리 대시보드
- **계정 병합** - 이메일 중복 시 기존 계정과 OAuth 계정 통합

### 보안
- **Rate Limiting** - 로그인 시도 횟수 제한 (최대 5회)
- **입력 검증** - SQL Injection, XSS 패턴 차단
- **CSRF 보호** - 요청 위조 방지
- **보안 헤더** - X-Frame-Options, X-Content-Type-Options 등

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| UI 라이브러리 | React 19 |
| 언어 | TypeScript (ESM) |
| 스타일 | Tailwind CSS |
| 서버 상태 | TanStack React Query 5 |
| 클라이언트 상태 | Zustand |
| 폼 관리 | React Hook Form |
| HTTP 클라이언트 | Axios (`@krgeobuk/http-client`) |

---

## 빠른 시작

### 환경 요구사항
- Node.js 18+
- auth-server 실행 중 (기본 포트 8000)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에서 실제 값으로 수정

# 3. 개발 서버 시작 (포트 3000)
npm run dev
```

### 스크립트

```bash
npm run dev          # 개발 서버 시작 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 서버 시작
npm run lint         # ESLint 검사
npm run type-check   # TypeScript 타입 검사
```

---

## 환경 변수

`.env.example`을 복사해 `.env.local`을 생성합니다.

### 필수 설정

```bash
# auth-server 연동
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000/auth
NEXT_PUBLIC_AUTH_REFRESH_URL=/auth/auth/refresh

# SSO 도메인
NEXT_PUBLIC_DOMAIN=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 연동 서비스 URL
NEXT_PUBLIC_PORTAL_CLIENT_URL=http://localhost:3200
NEXT_PUBLIC_PORTAL_ADMIN_URL=http://localhost:3210
```

### 선택 설정

```bash
# HTTP 보안 설정
ALLOWED_ORIGINS=localhost,127.0.0.1          # 허용 도메인 (쉼표 구분)
NEXT_PUBLIC_API_TIMEOUT=10000                # 요청 타임아웃 (ms)

# Rate Limiting
NEXT_PUBLIC_RATE_LIMIT_MAX_ATTEMPTS=50       # 분당 최대 요청 횟수
NEXT_PUBLIC_RATE_LIMIT_WINDOW_MS=60000       # 시간 윈도우 (ms)
```

### 프로덕션 설정

```bash
NEXT_PUBLIC_AUTH_SERVER_URL=https://api.krgeobuk.com/auth
NEXT_PUBLIC_DOMAIN=krgeobuk.com
NEXT_PUBLIC_APP_URL=https://auth.krgeobuk.com
NEXT_PUBLIC_PORTAL_CLIENT_URL=https://portal.krgeobuk.com
NEXT_PUBLIC_PORTAL_ADMIN_URL=https://admin.krgeobuk.com
NODE_ENV=production
ALLOWED_ORIGINS=krgeobuk.com,auth.krgeobuk.com,portal.krgeobuk.com,admin.krgeobuk.com
```

---

## 프로젝트 구조

```
src/
├── app/                          # Next.js 15 App Router
│   ├── login/                    # 로그인
│   ├── register/                 # 회원가입
│   ├── forgot-password/          # 비밀번호 찾기
│   ├── reset-password/           # 비밀번호 재설정
│   ├── email-verify/             # 이메일 인증
│   │   └── resend/               # 인증 이메일 재전송
│   ├── account-merge/            # 계정 병합
│   │   ├── request/              # 병합 요청
│   │   ├── confirm/              # 병합 확인 (이메일 링크)
│   │   ├── success/              # 병합 성공
│   │   ├── expired/              # 링크 만료
│   │   └── rejected/             # 병합 거부
│   ├── settings/
│   │   └── accounts/             # OAuth 계정 연동 관리
│   └── api/
│       └── health/               # 헬스체크 엔드포인트
│           └── ready/            # 준비 상태 확인
│
├── components/
│   ├── common/                   # 공통 UI
│   │   ├── AuthPageLayout.tsx    # 페이지 레이아웃 (form/card/dashboard)
│   │   ├── Alert.tsx             # 알림 메시지
│   │   ├── LoadingSpinner.tsx    # 로딩 스피너
│   │   └── StatusCard.tsx        # 상태 카드
│   ├── form/                     # 폼 컴포넌트
│   │   ├── FormInput.tsx         # 입력 필드
│   │   ├── FormError.tsx         # 에러 메시지
│   │   └── SubmitButton.tsx      # 제출 버튼
│   ├── OAuthEmailDuplicateError.tsx  # OAuth 이메일 중복 에러 UI
│   └── providers.tsx             # React Query 프로바이더
│
├── hooks/
│   ├── mutations/                # React Query 뮤테이션
│   │   ├── auth.ts               # 로그인, 회원가입, 비밀번호 등
│   │   ├── oauth.ts              # OAuth 계정 연동 해제
│   │   └── accountMerge.ts       # 계정 병합 요청/승인/거부
│   ├── queries/                  # React Query 쿼리
│   │   ├── keys.ts               # Query Key Factory
│   │   ├── auth.ts               # 인증 초기화
│   │   ├── oauth.ts              # 연동 계정 목록
│   │   └── accountMerge.ts       # 병합 토큰 검증
│   └── useOAuthErrorHandling.ts  # OAuth 에러 파싱 훅
│
├── services/                     # API 통신 서비스
│   ├── authService.ts            # 인증 API
│   ├── oauthService.ts           # OAuth 계정 관리 API
│   ├── ssoService.ts             # SSO 로그인 처리
│   └── accountMergeService.ts    # 계정 병합 API
│
├── store/
│   └── authStore.ts              # Zustand - 로그인 시도 횟수 관리
│
├── lib/
│   ├── httpClient.ts             # HTTP 클라이언트 설정 및 API 인스턴스
│   └── errorConverter.ts         # Axios 에러 → AuthError 변환
│
├── config/
│   └── constants.ts              # 전역 상수 (AUTH_CONFIG, ERROR_MESSAGES 등)
│
├── utils/
│   ├── validators.ts             # 폼 입력 유효성 검사
│   ├── oauthErrorMapper.ts       # OAuth 에러 코드 → 사용자 메시지
│   └── providerMapper.ts         # OAuth 제공자 라벨/아이콘 매핑
│
└── types/
    └── index.ts                  # TypeScript 타입 정의
```

---

## 페이지 라우트

| 경로 | 설명 |
|------|------|
| `/` | 홈 → `/login` 리다이렉트 |
| `/login` | 이메일/비밀번호 로그인, Google/Naver OAuth 로그인 |
| `/register` | 회원가입 |
| `/forgot-password` | 비밀번호 찾기 이메일 발송 |
| `/reset-password` | 비밀번호 재설정 (이메일 링크) |
| `/email-verify` | 이메일 인증 처리 (토큰 파라미터) |
| `/email-verify/resend` | 인증 이메일 재전송 |
| `/account-merge/request` | OAuth 이메일 중복 시 계정 병합 요청 |
| `/account-merge/confirm` | 병합 확인 (이메일 링크 → token 파라미터) |
| `/account-merge/success` | 병합 완료 안내 |
| `/account-merge/expired` | 병합 링크 만료 안내 |
| `/account-merge/rejected` | 병합 거부 안내 |
| `/settings/accounts` | 연동된 OAuth 계정 조회 및 해제 |

### API 엔드포인트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/health` | GET | 헬스체크 |
| `/api/health/ready` | GET | 준비 상태 확인 |

---

## SSO 연동 플로우

다른 서비스(portal-client 등)에서 인증이 필요할 때 auth-client로 리다이렉트됩니다.

```
1. 사용자가 portal-client 접근
2. portal-client → auth-client로 리다이렉트
   /login?redirect_session={sessionId}
3. 사용자가 auth-client에서 로그인
4. auth-server가 SSO 세션 처리
5. auth-client → portal-client로 리다이렉트 (redirectUrl 반환)
6. portal-client에서 서비스 이용
```

### SSO 파라미터

| 파라미터 | 설명 |
|----------|------|
| `redirect_session` | SSO 세션 ID (portal-client 등에서 전달) |
| `redirect` | 로그인 후 이동할 내부 경로 (`/`로 시작해야 함) |

---

## 계정 병합 플로우

OAuth 로그인 시 동일 이메일을 가진 기존 계정이 있을 때 발생합니다.

```
1. User B가 OAuth로 로그인 시도
2. auth-server: 이메일 중복 감지 → OAUTH_205 에러 반환
3. auth-client: /login 페이지에 OAuthEmailDuplicateError UI 표시
4. User B가 "계정 병합" 선택 → /account-merge/request
5. auth-server: 병합 확인 이메일 발송 (User B에게)
6. User B가 이메일의 링크 클릭 → /account-merge/confirm?token={token}
7. User B가 승인/거부 선택
8. 승인 시: User B의 OAuth 계정이 User A(기존 계정)에 통합
```

---

## 상태 관리

### 서버 상태 - React Query

```typescript
// 인증 초기화 (RefreshToken 기반)
const { data } = useAuthInitialize();
// data: { accessToken: string; user: UserProfile }

// 연동된 OAuth 계정 목록
const { data } = useLinkedAccounts(accessToken);

// 계정 병합 토큰 검증
const { data } = useVerifyMergeToken(token);
```

### 클라이언트 상태 - Zustand

```typescript
// 로그인 시도 횟수 관리
const { loginAttempts, isBlocked, incrementLoginAttempts, resetLoginAttempts } = useAuthStore();
```

### Query Key Factory

```typescript
import { queryKeys } from '@/hooks/queries/keys';

queryKeys.auth.initialize()                     // ['auth', 'initialize']
queryKeys.oauth.linkedAccounts()                // ['oauth', 'linkedAccounts']
queryKeys.accountMerge.verifyToken(token)       // ['accountMerge', 'verifyToken', token]
```

---

## HTTP 클라이언트

`@krgeobuk/http-client` 기반으로 auth-server와 통신합니다.

```typescript
import { authApi } from '@/lib/httpClient';

// GET
const response = await authApi.get<ResponseType>('/endpoint');

// POST
const response = await authApi.post<ResponseType>('/endpoint', requestBody);
```

**설정 요약:**
- `baseURL`: `NEXT_PUBLIC_AUTH_SERVER_URL` (기본값: `http://localhost:8000/auth`)
- `timeout`: 10초
- `withCredentials`: true (HTTP-only 쿠키 지원)
- `refreshUrl`: `NEXT_PUBLIC_AUTH_REFRESH_URL` (자동 토큰 갱신)
- Rate Limit: 분당 50회

---

## Docker 배포

```bash
# 이미지 빌드
docker build -t auth-client .

# 개발 환경 실행
docker run -p 3000:3000 --env-file .env.local auth-client

# 프로덕션 환경 실행
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_AUTH_SERVER_URL=https://auth-server.krgeobuk.com/api \
  -e NEXT_PUBLIC_DOMAIN=krgeobuk.com \
  -e NEXT_PUBLIC_APP_URL=https://auth.krgeobuk.com \
  auth-client
```

> `output: 'standalone'` 설정으로 Docker 최적화 빌드를 지원합니다.

---

## 포트 구성

| 서비스 | 포트 |
|--------|------|
| auth-client (이 앱) | 3000 |
| auth-server | 8000 |
| portal-client | 3200 |
| portal-admin-client | 3210 |
