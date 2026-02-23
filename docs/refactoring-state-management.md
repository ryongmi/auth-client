# auth-client 상태관리 리팩토링

## 개요

Redux Toolkit 기반 상태관리를 **react-query + Zustand + react-hook-form** 조합으로 전환합니다.

> **상태: 완료** (2026-02)

### 목적

| 기존 | 문제점 | 전환 후 |
|------|--------|---------|
| Redux Toolkit (thunk) | 서버 상태 2개를 위해 store/slice/thunk/hooks 전체 구조 유지 | react-query가 서버 상태 자동 관리 |
| Redux (클라이언트 상태) | loginAttempts/isBlocked만 관리하는데 과도한 보일러플레이트 | Zustand로 최소한의 클라이언트 상태 관리 |
| useFormInput 커스텀 훅 | react-hook-form 기능을 수동 재구현 | react-hook-form으로 폼 상태/검증 통합 |

### 기술 스택 변경

```
제거: @reduxjs/toolkit, react-redux
추가: @tanstack/react-query, zustand, react-hook-form
```

---

## Phase 1: 기반 설정 ✅

> 커밋: `ac1ab8e`

### 1-1. 패키지 변경

`package.json` 의존성 직접 수정 후 `npm install`:

```bash
# 제거
@reduxjs/toolkit
react-redux

# 추가
@tanstack/react-query
zustand
react-hook-form
```

### 1-2. Provider 교체

**파일**: `src/components/providers.tsx`

SSR 안전성을 위해 `useState`로 QueryClient 생성:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

> **계획과 차이**: `const queryClient = new QueryClient(...)` 대신 `useState(() => new QueryClient(...))` 사용 — SSR 환경에서 클라이언트 인스턴스 공유 방지

---

## Phase 2: Zustand 스토어 생성 ✅

> 커밋: `369365a`

### 2-1. 생성: `src/store/authStore.ts`

Redux authSlice에서 클라이언트 전용 상태만 이관:

```typescript
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

### 2-2. 삭제된 파일

- `src/store/index.ts`
- `src/store/hooks.ts`
- `src/store/slices/authSlice.ts`

---

## Phase 3: react-query 전환 ✅

> 커밋: `abd07e7`

### 3-1. Mutation 훅 (`src/hooks/mutations/`)

10개 mutation 훅 생성. 계획 대비 `any` 타입 없이 구체적인 TypeScript 제네릭 사용:

#### `useLogin.ts`

```typescript
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useLogin() {
  const { incrementLoginAttempts, resetLoginAttempts } = useAuthStore();

  return useMutation<LoginResponse, AuthError, LoginParams>({
    mutationFn: ({ loginData, redirectSession }) =>
      authService.login(loginData, redirectSession),
    onSuccess: () => resetLoginAttempts(),
    onError: () => incrementLoginAttempts(),
  });
}
```

#### `useUnlinkAccount.ts`

```typescript
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, AuthError, UnlinkAccountParams>({
    mutationFn: ({ provider, accessToken }) =>
      oauthService.unlinkAccount(provider, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['linkedAccounts'] });
    },
  });
}
```

#### 나머지 mutation 훅

| 파일 | TData | TVariables |
|------|-------|------------|
| `useSignup.ts` | `SignupResponse` | `SignupParams` |
| `useForgotPassword.ts` | `{ message: string }` | `ForgotPasswordFormData` |
| `useResetPassword.ts` | `{ message: string }` | `ResetPasswordParams` |
| `useVerifyEmail.ts` | `{ message: string }` | `string` (token) |
| `useResendVerification.ts` | `{ message: string }` | `string` (email) |
| `useInitiateMerge.ts` | `AccountMergeInitiateResponse` | `InitiateMergeParams` |
| `useConfirmMerge.ts` | `void` | `ConfirmMergeParams` |
| `useRejectMerge.ts` | `void` | `RejectMergeParams` |

### 3-2. Query 훅 (`src/hooks/queries/`)

#### `useAuthInitialize.ts`

```typescript
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAuthInitialize(options: UseAuthInitializeOptions = {}) {
  const { enabled = true } = options;

  return useQuery<AuthInitData, AuthError>({
    queryKey: ['authInitialize'],
    queryFn: () => authService.initialize(),
    enabled,
    retry: (failureCount, error) => {
      if (isUnauthorized(error)) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

> **계획과 차이**: `onUnauthorized` 콜백 제거 — 에러 상태를 컴포넌트에서 직접 처리하는 방식으로 단순화

#### `useVerifyMergeToken.ts`, `useLinkedAccounts.ts`

`AuthError` 제네릭 명시 및 `enabled` 조건 활용.

### 3-3. 상태 대체 매핑

| 기존 수동 관리 | react-query 대체 |
|---------------|-----------------|
| `useState(isLoading)` | `mutation.isPending` |
| `useState(error)` / Redux `error` | `mutation.error` |
| `useState(isRetrying)` | `mutation.isPending` (재호출 시) |
| `useState(retryCount)` | 제거 |
| `useState(lastError)` | `mutation.error` |
| `useState(isSuccess)` | `mutation.isSuccess` |
| `useState(data)` | `mutation.data` |

### 3-4. 삭제된 파일

- `src/hooks/useAuthInitialize.ts` (쿼리 훅으로 대체)

---

## Phase 4: react-hook-form 전환 ✅

> 커밋: `bc60d0e`

### 4-1. FormInput 컴포넌트 수정

**파일**: `src/components/form/FormInput.tsx`

`UseFormRegisterReturn` 타입으로 `registration` prop 수용:

```typescript
import type { UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  registration?: UseFormRegisterReturn;
  disabled?: boolean;
}

// 사용 예시
<FormInput
  label="이메일"
  type="email"
  registration={register('email', {
    validate: (value) => {
      const result = validateEmail(value);
      return result.isValid || result.error || true;
    },
  })}
  error={errors.email?.message}
  icon={FormInputIcons.Email}
/>
```

> **계획과 차이**: `validate`에서 `validators.ts` 함수가 `{ isValid, error }` 객체를 반환하므로 `result.isValid || result.error || true` 패턴 사용

### 4-2. 삭제된 파일

- `src/hooks/useFormInput.ts`

---

## Phase 5: 페이지 컴포넌트 리팩토링 ✅

> 커밋: `662e74f`

### 전환된 페이지 (9개)

| 페이지 | 사용 훅 |
|--------|---------|
| `login/page.tsx` | `useForm` + `useLogin` + `useAuthStore` |
| `register/page.tsx` | `useForm` + `useSignup` |
| `forgot-password/page.tsx` | `useForm` + `useForgotPassword` |
| `reset-password/page.tsx` | `useForm` + `useResetPassword` |
| `email-verify/page.tsx` | `useVerifyEmail` |
| `email-verify/resend/page.tsx` | `useForm` + `useResendVerification` |
| `account-merge/request/page.tsx` | `useForm` + `useAuthInitialize` + `useInitiateMerge` |
| `account-merge/confirm/page.tsx` | `useVerifyMergeToken` + `useAuthInitialize` + `useConfirmMerge` + `useRejectMerge` |
| `settings/accounts/page.tsx` | `useAuthInitialize` + `useLinkedAccounts` + `useUnlinkAccount` |

### 공통 전환 패턴

```typescript
// Before
const dispatch = useAppDispatch();
const { isLoading, error } = useAppSelector((state) => state.auth);
const { values, errors, handleChange } = useFormInput({ ... });

// After
const { register, handleSubmit, formState: { errors } } = useForm({ ... });
const mutation = useSomeMutation();

const onSubmit = (data: FormData): void => {
  mutation.mutate(data, {
    onSuccess: (response) => { /* 리다이렉트 등 */ },
    onError: (error) => { setSubmitError(error.message); },
  });
};
```

---

## Phase 6: 빌드 오류 수정 ✅

> 커밋: `d993663` (shared-lib), `108ba12` (auth-client)

### 문제

`@krgeobuk/shared/oauth` barrel export가 DTO/validation을 통해 `@nestjs/swagger` → `@nestjs/core` → `@nestjs/websockets` 의존 체인을 유발, Next.js 클라이언트 번들에서 빌드 실패.

### 해결 방법

**shared-lib** `packages/shared/package.json`에 enum 전용 서브 엔트리포인트 추가:

```json
{
  "exports": {
    "./oauth/enum": {
      "import": "./dist/oauth/enums/index.js",
      "require": "./dist/oauth/enums/index.js",
      "types": "./dist/oauth/enums/index.d.ts"
    },
    "./account-merge/enum": {
      "import": "./dist/account-merge/enums/index.js",
      "require": "./dist/account-merge/enums/index.js",
      "types": "./dist/account-merge/enums/index.d.ts"
    }
  }
}
```

**auth-client** import 경로 변경 (5개 파일):

```typescript
// Before (NestJS 의존 체인 유발)
import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth';
import { AccountMergeStatus } from '@krgeobuk/shared/account-merge';

// After (enum만 import)
import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth/enum';
import { AccountMergeStatus } from '@krgeobuk/shared/account-merge/enum';
```

**변경된 파일**: `types/index.ts`, `utils/validators.ts`, `utils/oauthErrorMapper.ts`, `utils/providerMapper.ts`, `services/oauthService.ts`

---

## 추가 수정 ✅

### Lint 수정

> 커밋: `b3d7cad`

- mutation/query 훅 함수: `// eslint-disable-next-line @typescript-eslint/explicit-function-return-type` 주석 추가
- `authStore.ts`: 함수 반환 타입 `: void` 명시
- `account-merge/confirm/page.tsx`: `getStatusDisplay` 반환 타입 `{ text: string; color: string }` 명시
- `login/page.tsx`, `register/page.tsx`: IIFE 반환 타입 `: string` 명시
- `email-verify/page.tsx`: 미정의 `react-hooks/exhaustive-deps` eslint-disable 주석 제거

### Next.js 15 viewport 경고 수정

> 커밋: `855b3e6`

**파일**: `src/app/layout.tsx`

```typescript
// Before: metadata에 viewport, themeColor 포함 (Next.js 15 경고)
export const metadata: Metadata = {
  viewport: "width=device-width, initial-scale=1",
  themeColor: [...],
};

// After: 별도 viewport export로 분리
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "KRGeobuk Auth",
  description: "KRGeobuk 통합 인증 서비스",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};
```

---

## 최종 파일 구조

### 삭제된 파일

| 파일 | 이유 |
|------|------|
| `src/store/index.ts` | Redux store → Zustand로 대체 |
| `src/store/hooks.ts` | useAppDispatch/useAppSelector 불필요 |
| `src/store/slices/authSlice.ts` | react-query + Zustand로 분리 |
| `src/hooks/useFormInput.ts` | react-hook-form으로 대체 |
| `src/hooks/useAuthInitialize.ts` | useAuthInitialize query 훅으로 대체 |

### 생성된 파일

| 파일 | 역할 |
|------|------|
| `src/store/authStore.ts` | Zustand 클라이언트 상태 (loginAttempts, isBlocked) |
| `src/hooks/mutations/useLogin.ts` | 로그인 |
| `src/hooks/mutations/useSignup.ts` | 회원가입 |
| `src/hooks/mutations/useForgotPassword.ts` | 비밀번호 찾기 |
| `src/hooks/mutations/useResetPassword.ts` | 비밀번호 재설정 |
| `src/hooks/mutations/useVerifyEmail.ts` | 이메일 인증 |
| `src/hooks/mutations/useResendVerification.ts` | 인증 재전송 |
| `src/hooks/mutations/useInitiateMerge.ts` | 계정 병합 요청 |
| `src/hooks/mutations/useConfirmMerge.ts` | 계정 병합 승인 |
| `src/hooks/mutations/useRejectMerge.ts` | 계정 병합 거절 |
| `src/hooks/mutations/useUnlinkAccount.ts` | OAuth 연결 해제 |
| `src/hooks/queries/useAuthInitialize.ts` | 인증 초기화 |
| `src/hooks/queries/useVerifyMergeToken.ts` | 병합 토큰 검증 |
| `src/hooks/queries/useLinkedAccounts.ts` | 연결 계정 목록 |

### 주요 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `package.json` | 의존성 변경 |
| `src/components/providers.tsx` | Redux Provider → QueryClientProvider (useState 패턴) |
| `src/components/form/FormInput.tsx` | `UseFormRegisterReturn` registration prop 추가 |
| `src/app/layout.tsx` | viewport/themeColor를 Viewport export로 분리 |
| `src/types/index.ts` | `@krgeobuk/shared/account-merge/enum` import |
| `src/utils/validators.ts` | `@krgeobuk/shared/oauth/enum` import |
| `src/utils/oauthErrorMapper.ts` | `@krgeobuk/shared/oauth/enum` import |
| `src/utils/providerMapper.ts` | `@krgeobuk/shared/oauth/enum` import |
| `src/services/oauthService.ts` | `@krgeobuk/shared/oauth/enum` import |
| `src/app/login/page.tsx` | useForm + useLogin + useAuthStore |
| `src/app/register/page.tsx` | useForm + useSignup |
| `src/app/forgot-password/page.tsx` | useForm + useForgotPassword |
| `src/app/reset-password/page.tsx` | useForm + useResetPassword |
| `src/app/email-verify/page.tsx` | useVerifyEmail |
| `src/app/email-verify/resend/page.tsx` | useForm + useResendVerification |
| `src/app/account-merge/request/page.tsx` | useAuthInitialize + useInitiateMerge |
| `src/app/account-merge/confirm/page.tsx` | useVerifyMergeToken + useConfirmMerge + useRejectMerge |
| `src/app/settings/accounts/page.tsx` | useAuthInitialize + useLinkedAccounts + useUnlinkAccount |

### 유지된 파일 (변경 없음)

- `src/services/*` — 서비스 레이어
- `src/utils/validators.ts` — 검증 함수 (import 경로만 변경)
- `src/config/constants.ts` — 상수
- `src/lib/errorConverter.ts` — 에러 변환
- `src/lib/httpClient.ts` — HTTP 클라이언트
- `src/hooks/useOAuthErrorHandling.ts` — OAuth 에러 처리
- `src/components/common/*` — 공통 컴포넌트
- `src/components/form/FormError.tsx` — 에러 표시
- `src/components/form/SubmitButton.tsx` — 제출 버튼
- `src/components/OAuthEmailDuplicateError.tsx` — OAuth 에러 컴포넌트

---

## 커밋 이력

| 커밋 | 내용 |
|------|------|
| `ac1ab8e` | Phase 1 — 패키지 변경 + QueryClientProvider |
| `369365a` | Phase 2 — Redux store → Zustand |
| `abd07e7` | Phase 3 — react-query mutation/query 훅 생성 |
| `bc60d0e` | Phase 4 — FormInput react-hook-form 호환 수정 |
| `662e74f` | Phase 5 — 전체 페이지 컴포넌트 전환 |
| `d993663` | shared-lib — oauth/enum, account-merge/enum 서브 엔트리포인트 추가 |
| `108ba12` | auth-client — enum 전용 import 경로로 변경 |
| `1a0a49e` | account-merge/request 빌드 에러 수정 + package-lock 갱신 |
| `b3d7cad` | lint 에러 수정 |
| `855b3e6` | Next.js 15 viewport export 분리 |
