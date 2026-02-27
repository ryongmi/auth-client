# CLAUDE.md - Auth Client

이 파일은 auth-client 작업 시 Claude Code의 가이드라인을 제공합니다.

## 프로젝트 개요

auth-client는 krgeobuk 생태계의 중앙 인증 서비스로, `auth.krgeobuk.com`에서 서비스됩니다.
모든 krgeobuk 서비스의 SSO(Single Sign-On) 허브 역할을 담당합니다.

### 기술 스택
- **Next.js 15** - App Router, `'use client'` 컴포넌트 중심
- **React 19** - 최신 React 기능
- **TanStack React Query 5** - 서버 상태 관리 (데이터 페칭, 캐싱)
- **Zustand** - 클라이언트 상태 관리 (로그인 시도 횟수 등 경량 상태)
- **React Hook Form** - 폼 상태 관리
- **Tailwind CSS** - 스타일링
- **`@krgeobuk/http-client`** - HTTP 클라이언트 (auth-server 통신)

---

## 핵심 명령어

```bash
# 개발 서버 시작 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 타입 검사
npm run type-check

# 린팅
npm run lint
```

---

## 아키텍처 패턴

### 1. 페이지 구조 (App Router)

모든 인증 페이지는 `'use client'` 컴포넌트입니다.
`useSearchParams()`를 사용하므로 반드시 `Suspense`로 감싸야 합니다.

```typescript
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthPageLayout, AuthPageFallback } from '@/components/common';

function PageContent(): React.JSX.Element {
  const searchParams = useSearchParams();

  // SSO 파라미터 추출
  const redirectSession = searchParams.get('redirect_session');
  const redirectPath = searchParams.get('redirect');

  return (
    <AuthPageLayout variant="form">
      {/* ... */}
    </AuthPageLayout>
  );
}

// Suspense 필수 - useSearchParams() 때문
export default function Page(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthPageFallback variant="form" />}>
      <PageContent />
    </Suspense>
  );
}
```

**AuthPageLayout variant:**
- `form` - 그라데이션 배경, max-w-md (로그인/회원가입 등)
- `card` - 흰색 카드 컨테이너 (상태 안내 페이지)
- `dashboard` - 넓은 레이아웃, max-w-3xl (계정 관리)

---

### 2. 서비스 레이어 패턴

싱글톤 클래스 패턴으로 구현합니다. 에러는 반드시 `convertToAuthError`로 변환합니다.

```typescript
// src/services/authService.ts
import { authApi } from '@/lib/httpClient';
import { convertToAuthError } from '@/lib/errorConverter';

export class AuthService {
  async login(loginData: LoginRequest, redirectSession?: string): Promise<LoginResponse> {
    try {
      const url = redirectSession
        ? `/auth/login?redirect_session=${redirectSession}`
        : '/auth/login';
      const response = await authApi.post<LoginResponse>(url, loginData);
      return response.data;
    } catch (error) {
      throw convertToAuthError(error); // 반드시 AuthError로 변환
    }
  }
}

// 싱글톤 인스턴스로 export
export const authService = new AuthService();
```

**현재 서비스 목록:**
- `authService` - 로그인, 회원가입, 비밀번호 관리, 이메일 인증, 초기화
- `oauthService` - OAuth 계정 연동/해제, 연동 URL 생성
- `ssoService` - SSO 로그인 처리
- `accountMergeService` - 계정 병합 요청/승인/거부/조회

---

### 3. React Query 훅 패턴

#### Mutation 훅

```typescript
// src/hooks/mutations/auth.ts
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, LoginResponse, AuthError } from '@/types';

interface LoginParams {
  loginData: LoginRequest;
  redirectSession?: string;
}

export function useLogin() {
  const { incrementLoginAttempts, resetLoginAttempts } = useAuthStore();

  return useMutation<LoginResponse, AuthError, LoginParams>({
    mutationFn: ({ loginData, redirectSession }) =>
      authService.login(loginData, redirectSession),
    onSuccess: () => {
      resetLoginAttempts();
    },
    onError: () => {
      incrementLoginAttempts();
    },
  });
}
```

**페이지에서 사용:**

```typescript
const loginMutation = useLogin();

loginMutation.mutate(
  { loginData: data, redirectSession },
  {
    onSuccess: (response) => {
      window.location.href = response.redirectUrl || '/';
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  }
);
```

#### Query 훅

```typescript
// src/hooks/queries/auth.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';

export function useAuthInitialize(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery<AuthInitData, AuthError>({
    queryKey: queryKeys.auth.initialize(),
    queryFn: () => authService.initialize(),
    enabled,
    retry: (failureCount, error) => {
      if (isUnauthorized(error)) return false; // 401은 재시도 안 함
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

---

### 4. Query Key Factory

모든 queryKey는 `src/hooks/queries/keys.ts`에서 관리합니다. 인라인 문자열 배열 사용 금지.

```typescript
// src/hooks/queries/keys.ts
export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
    initialize: () => ['auth', 'initialize'] as const,
  },
  oauth: {
    all: () => ['oauth'] as const,
    linkedAccounts: () => ['oauth', 'linkedAccounts'] as const,
  },
  accountMerge: {
    all: () => ['accountMerge'] as const,
    verifyToken: (token: string | null) => ['accountMerge', 'verifyToken', token] as const,
  },
} as const;
```

**새 쿼리 추가 시 keys.ts에 먼저 등록:**

```typescript
// 추가 예시
users: {
  all: () => ['users'] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
},
```

---

### 5. Zustand 상태 관리

React Query가 처리하지 않는 순수 클라이언트 상태만 Zustand로 관리합니다.

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { AUTH_CONFIG } from '@/config/constants';

interface AuthStore {
  loginAttempts: number;
  isBlocked: boolean;
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  loginAttempts: 0,
  isBlocked: false,

  incrementLoginAttempts: (): void => {
    const attempts = get().loginAttempts + 1;
    set({
      loginAttempts: attempts,
      isBlocked: attempts >= AUTH_CONFIG.LOGIN_MAX_ATTEMPTS,
    });
  },

  resetLoginAttempts: (): void => {
    set({ loginAttempts: 0, isBlocked: false });
  },
}));
```

**사용:**
```typescript
const { loginAttempts, isBlocked } = useAuthStore();
const remainingAttempts = AUTH_CONFIG.LOGIN_MAX_ATTEMPTS - loginAttempts;
```

---

### 6. OAuth 에러 처리 패턴

OAuth 콜백 후 `/login?error=OAUTH_205&provider=...` 형태로 리다이렉트됩니다.
`useOAuthErrorHandling` 훅이 URL 파라미터를 파싱해서 상태로 변환합니다.

```typescript
const {
  oauthEmailDuplicateDetails, // OAUTH_205: 이메일 중복 상세 정보
  mergeRequestSent,           // OAUTH_202: 병합 요청 발송됨
  errorMessage,               // 기타 OAuth 에러 메시지
  clearEmailDuplicateDetails,
  clearMergeRequestSent,
  clearErrorMessage,
} = useOAuthErrorHandling();
```

**OAuth 에러 코드:**
- `OAUTH_205` - 이메일 중복 → `OAuthEmailDuplicateError` 컴포넌트 표시
- `OAUTH_202` - 다른 사용자가 사용 중 → 계정 병합 요청 발송됨 안내
- 기타 - `errorMessage`에 사용자 친화 메시지 설정

---

### 7. 폼 구현 패턴

React Hook Form + 공통 폼 컴포넌트를 사용합니다.

```typescript
import { useForm } from 'react-hook-form';
import { FormInput, FormInputIcons, FormError, SubmitButton, SubmitButtonIcons } from '@/components/form';
import { validateEmail, validatePassword } from '@/utils/validators';

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  defaultValues: { email: '', password: '' },
});

// JSX
<form onSubmit={handleSubmit(onSubmit)}>
  <FormInput
    label="이메일 주소"
    type="email"
    registration={register('email', {
      validate: (value) => {
        const result = validateEmail(value);
        return result.isValid || result.error || true;
      },
    })}
    placeholder="이메일을 입력하세요"
    error={errors.email?.message}
    icon={FormInputIcons.Email}
  />

  {submitError && (
    <FormError
      message={submitError}
      error={mutation.error}
      onRetry={handleRetry}
      isRetrying={mutation.isPending}
    />
  )}

  <SubmitButton
    isLoading={mutation.isPending}
    loadingText="처리 중..."
    isBlocked={isBlocked}
    icon={SubmitButtonIcons.Login}
  >
    로그인
  </SubmitButton>
</form>
```

---

### 8. HTTP 클라이언트 사용

`authApi`를 통해 auth-server와 통신합니다. 직접 axios 사용 금지.

```typescript
import { authApi } from '@/lib/httpClient';

// GET
const response = await authApi.get<ResponseType>('/endpoint');
return response.data;

// POST
const response = await authApi.post<ResponseType>('/endpoint', requestBody);
return response.data;
```

**설정 (httpClient.ts):**
- `baseURL`: `NEXT_PUBLIC_AUTH_SERVER_URL`
- `timeout`: 10초
- `withCredentials`: true (HTTP-only 쿠키)
- `refreshUrl`: `NEXT_PUBLIC_AUTH_REFRESH_URL` (자동 토큰 갱신)

---

## auth-server API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/login` | 로그인 (SSO: `?redirect_session=`) |
| POST | `/auth/signup` | 회원가입 (SSO: `?redirect_session=`) |
| POST | `/auth/forgot-password` | 비밀번호 찾기 이메일 발송 |
| POST | `/auth/reset-password` | 비밀번호 재설정 |
| POST | `/auth/verify-email/request` | 이메일 인증 요청 |
| POST | `/auth/verify-email/confirm` | 이메일 인증 확인 |
| POST | `/auth/initialize` | 초기화 (RefreshToken → AccessToken + UserProfile) |
| GET | `/oauth/login-google` | Google OAuth 시작 (쿼리: `redirect_session`) |
| GET | `/oauth/login-naver` | Naver OAuth 시작 (쿼리: `redirect_session`) |
| GET | `/oauth/accounts` | 연동된 OAuth 계정 목록 |
| DELETE | `/oauth/accounts/:provider` | OAuth 계정 연동 해제 |
| POST | `/account-merge/verify-token` | 병합 확인 토큰 검증 |
| POST | `/account-merge/initiate` | 계정 병합 요청 |
| POST | `/account-merge/:id/confirm` | 계정 병합 승인 |
| POST | `/account-merge/:id/reject` | 계정 병합 거부 |

---

## 환경 변수

```bash
# 필수
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000/auth   # auth-server 주소
NEXT_PUBLIC_AUTH_REFRESH_URL=/auth/auth/refresh           # 토큰 갱신 엔드포인트
NEXT_PUBLIC_DOMAIN=localhost                             # 쿠키 도메인
NEXT_PUBLIC_APP_URL=http://localhost:3000                # 이 앱의 주소
NEXT_PUBLIC_PORTAL_CLIENT_URL=http://localhost:3200      # portal-client
NEXT_PUBLIC_PORTAL_ADMIN_URL=http://localhost:3210       # portal-admin-client

# 선택
ALLOWED_ORIGINS=localhost,127.0.0.1                      # 허용 도메인 (쉼표 구분)
NEXT_PUBLIC_API_TIMEOUT=10000                            # 요청 타임아웃 (ms)
NEXT_PUBLIC_RATE_LIMIT_MAX_ATTEMPTS=50                   # 분당 최대 요청 횟수
```

---

## 개발 워크플로우

### 새 페이지 추가 순서

1. `src/app/{route}/page.tsx` 생성 — `Suspense` + `'use client'` 패턴 적용
2. 필요한 타입 → `src/types/index.ts` 추가
3. 서비스 메서드 → `src/services/{domain}Service.ts` 추가
4. Query Key → `src/hooks/queries/keys.ts` 등록
5. 쿼리/뮤테이션 훅 → `src/hooks/{mutations|queries}/{domain}.ts` 추가
6. 페이지에서 훅 연결

### 코드 품질 체크

```bash
npm run type-check   # TypeScript 오류 확인 (필수)
npm run lint         # ESLint 검사 (필수)
```

---

## 주요 상수 (src/config/constants.ts)

```typescript
AUTH_CONFIG = {
  LOGIN_MAX_ATTEMPTS: 5,          // 로그인 최대 시도 횟수
  PASSWORD_MIN_LENGTH: 8,         // 비밀번호 최소 길이
  PASSWORD_MAX_LENGTH: 20,        // 비밀번호 최대 길이
  NAME_MIN_LENGTH: 3,             // 이름 최소 길이
  SESSION_ID_REGEX: /^[a-zA-Z0-9_-]{20,}$/, // SSO 세션 ID 형식
}
```

---

## 문제 해결

### useSearchParams 관련 에러
`useSearchParams()`는 `Suspense` 경계 내에서만 사용 가능합니다.

```typescript
// ✅ 올바른 패턴
export default function Page() {
  return (
    <Suspense fallback={<AuthPageFallback variant="form" />}>
      <PageContent />  {/* useSearchParams() 여기서 사용 */}
    </Suspense>
  );
}
```

### CORS 에러
- auth-server의 CORS 허용 출처에 `NEXT_PUBLIC_APP_URL` 추가 확인
- `withCredentials: true` 사용 시 서버에서 `Access-Control-Allow-Origin`에 와일드카드(`*`) 사용 불가

### OAuth 콜백 에러
- auth-server OAuth 설정의 리다이렉트 URI 일치 여부 확인
- URL 파라미터 `error` 값이 `isOAuthErrorCode()` 목록에 있는지 확인

### 토큰 갱신 실패
- `NEXT_PUBLIC_AUTH_REFRESH_URL` 환경변수 확인
- auth-server의 `/auth/refresh` 엔드포인트 응답 확인
- HTTP-only 쿠키에 RefreshToken이 정상적으로 설정됐는지 브라우저 개발자 도구 확인

---

## 디버깅 도구

- **ReactQueryDevtools**: 개발 환경에서 자동 활성화 — 캐시 상태, 쿼리 결과 시각적 확인
- **브라우저 개발자 도구 → Network**: API 요청/응답 및 쿠키 확인
- **브라우저 개발자 도구 → Application → Cookies**: HTTP-only 쿠키 상태 확인

---

## 참조 문서

- **공통 Next.js 표준**: [docs/KRGEOBUK_NEXTJS_CLIENT_GUIDE.md](../docs/KRGEOBUK_NEXTJS_CLIENT_GUIDE.md)
- **auth-server API**: [auth-server/CLAUDE.md](../auth-server/CLAUDE.md)
- **전체 아키텍처**: [CLAUDE.md](../CLAUDE.md)
