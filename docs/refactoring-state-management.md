# auth-client 상태관리 리팩토링 계획

## 개요

Redux Toolkit 기반 상태관리를 **react-query + Zustand + react-hook-form** 조합으로 전환합니다.

### 목적

| 현재 | 문제점 | 전환 후 |
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

## Phase 1: 기반 설정

### 1-1. 패키지 설치

```bash
npm install @tanstack/react-query zustand react-hook-form
npm uninstall @reduxjs/toolkit react-redux
```

### 1-2. Provider 교체

**파일**: `src/components/providers.tsx`

```typescript
// Before
import { Provider } from 'react-redux';
import { store } from '@/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

// After
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
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
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Phase 2: Zustand 스토어 생성

### 2-1. 파일 생성: `src/store/authStore.ts`

Redux authSlice에서 **클라이언트 전용 상태만** 이관합니다.

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

  incrementLoginAttempts: () => {
    const attempts = get().loginAttempts + 1;
    set({
      loginAttempts: attempts,
      isBlocked: attempts >= AUTH_CONFIG.LOGIN_MAX_ATTEMPTS,
    });
  },

  resetLoginAttempts: () => {
    set({ loginAttempts: 0, isBlocked: false });
  },
}));
```

### 2-2. 삭제 대상

- `src/store/index.ts`
- `src/store/hooks.ts`
- `src/store/slices/authSlice.ts`

---

## Phase 3: react-query 전환

### 3-1. Mutation 훅 (`src/hooks/mutations/`)

#### `useLogin.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { convertToAuthError } from '@/lib/errorConverter';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, AuthError } from '@/types';

interface LoginParams {
  loginData: LoginRequest;
  redirectSession?: string;
}

export function useLogin() {
  const { incrementLoginAttempts, resetLoginAttempts } = useAuthStore();

  return useMutation<any, AuthError, LoginParams>({
    mutationFn: ({ loginData, redirectSession }) =>
      authService.login(loginData, redirectSession),
    onSuccess: () => {
      resetLoginAttempts();
    },
    onError: (error) => {
      incrementLoginAttempts();
    },
    meta: { convertError: true },
  });
}
```

#### `useSignup.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { ExtendedSignupRequest, AuthError } from '@/types';

interface SignupParams {
  signupData: ExtendedSignupRequest;
  redirectSession?: string;
}

export function useSignup() {
  return useMutation<any, AuthError, SignupParams>({
    mutationFn: ({ signupData, redirectSession }) =>
      authService.signup(signupData, redirectSession),
  });
}
```

#### `useForgotPassword.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { ForgotPasswordFormData, AuthError } from '@/types';

export function useForgotPassword() {
  return useMutation<{ message: string }, AuthError, ForgotPasswordFormData>({
    mutationFn: (data) => authService.forgotPassword(data),
  });
}
```

#### `useResetPassword.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { ResetPasswordFormData, AuthError } from '@/types';

export function useResetPassword() {
  return useMutation<{ message: string }, AuthError, ResetPasswordFormData>({
    mutationFn: (data) => authService.resetPassword(data),
  });
}
```

#### `useVerifyEmail.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

export function useVerifyEmail() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (token) => authService.verifyEmail(token),
  });
}
```

#### `useResendVerification.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

export function useResendVerification() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (email) => authService.requestEmailVerification(email),
  });
}
```

#### `useInitiateMerge.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';

export function useInitiateMerge() {
  return useMutation<any, AuthError, { dto: any; accessToken: string }>({
    mutationFn: ({ dto, accessToken }) =>
      accountMergeService.initiateAccountMerge(dto, accessToken),
  });
}
```

#### `useConfirmMerge.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';

export function useConfirmMerge() {
  return useMutation<any, AuthError, { requestId: string; accessToken: string }>({
    mutationFn: ({ requestId, accessToken }) =>
      accountMergeService.confirmAccountMerge(requestId, accessToken),
  });
}
```

#### `useRejectMerge.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';

export function useRejectMerge() {
  return useMutation<any, AuthError, { requestId: string; accessToken: string }>({
    mutationFn: ({ requestId, accessToken }) =>
      accountMergeService.rejectAccountMerge(requestId, accessToken),
  });
}
```

#### `useUnlinkAccount.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { oauthService } from '@/services/oauthService';
import type { AuthError } from '@/types';

export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation<any, AuthError, { provider: string; accessToken: string }>({
    mutationFn: ({ provider, accessToken }) =>
      oauthService.unlinkAccount(provider, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedAccounts'] });
    },
  });
}
```

### 3-2. Query 훅 (`src/hooks/queries/`)

#### `useAuthInitialize.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';

interface UseAuthInitializeOptions {
  enabled?: boolean;
  onUnauthorized?: () => void;
}

export function useAuthInitialize(options: UseAuthInitializeOptions = {}) {
  const { enabled = true, onUnauthorized } = options;

  return useQuery({
    queryKey: ['authInitialize'],
    queryFn: async () => {
      try {
        return await authService.initialize();
      } catch (error: any) {
        if (error?.response?.status === 401) {
          onUnauthorized?.();
          return null;
        }
        throw error;
      }
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
```

#### `useVerifyMergeToken.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';

export function useVerifyMergeToken(token: string | null) {
  return useQuery({
    queryKey: ['verifyMergeToken', token],
    queryFn: () => accountMergeService.verifyToken(token!),
    enabled: !!token,
    retry: false,
  });
}
```

#### `useLinkedAccounts.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { oauthService } from '@/services/oauthService';

export function useLinkedAccounts(accessToken: string | null) {
  return useQuery({
    queryKey: ['linkedAccounts'],
    queryFn: () => oauthService.getLinkedAccounts(accessToken!),
    enabled: !!accessToken,
  });
}
```

### 3-3. Mutation이 대체하는 상태

각 mutation이 자체적으로 제공하는 상태로 기존 수동 관리 상태를 대체합니다:

| 기존 수동 관리 | react-query 대체 |
|---------------|-----------------|
| `useState(isLoading)` | `mutation.isPending` |
| `useState(error)` / Redux `error` | `mutation.error` |
| `useState(isRetrying)` | `mutation.isPending` (재호출 시) |
| `useState(retryCount)` | 제거 (mutation 자동 관리) |
| `useState(lastError)` | `mutation.error` |
| `useState(isSuccess)` | `mutation.isSuccess` |
| `useState(data)` | `mutation.data` |

---

## Phase 4: react-hook-form 전환

### 4-1. FormInput 컴포넌트 수정

**파일**: `src/components/form/FormInput.tsx`

react-hook-form의 `register` 반환값을 직접 전달받도록 수정합니다.

```typescript
// Before
interface FormInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  // ...
}

// After
interface FormInputProps {
  error?: string;         // FieldError.message를 전달
  registration?: object;  // register() 반환값 spread
  // label, type, placeholder, disabled, icon 등 유지
}

// 사용 예시
<FormInput
  label="이메일"
  type="email"
  placeholder="이메일을 입력하세요"
  error={errors.email?.message}
  icon={FormInputIcons.Email}
  registration={register('email', {
    required: ERROR_MESSAGES.EMAIL_REQUIRED,
    validate: (v) => validateEmail(v) || true,
  })}
/>
```

### 4-2. 폼별 전환 상세

#### login/page.tsx

```typescript
// Before
const { values, errors, handleChange, setError, clearAllErrors } = useFormInput(
  { email: '', password: '' },
);

// After
const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginFormData>({
  defaultValues: { email: '', password: '' },
});

const loginMutation = useLogin();
const { isBlocked, loginAttempts } = useAuthStore();

const onSubmit = handleSubmit((data) => {
  loginMutation.mutate(
    { loginData: data, redirectSession },
    {
      onSuccess: (response) => {
        // 리다이렉트 처리
      },
    },
  );
});
```

#### register/page.tsx

```typescript
const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>({
  defaultValues: {
    email: '', password: '', confirmPassword: '',
    name: '', nickname: '', agreedToTerms: false,
  },
});

const signupMutation = useSignup();
const password = watch('password');

// confirmPassword 검증
register('confirmPassword', {
  validate: (v) => validatePasswordConfirm(password, v) || true,
});
```

#### forgot-password/page.tsx

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
  defaultValues: { email: '' },
});

const forgotMutation = useForgotPassword();

const onSubmit = handleSubmit((data) => {
  forgotMutation.mutate(data);
});
```

#### reset-password/page.tsx

```typescript
const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>({
  defaultValues: { password: '', confirmPassword: '' },
});

const resetMutation = useResetPassword();
```

#### email-verify/resend/page.tsx

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
  defaultValues: { email: '' },
});

const resendMutation = useResendVerification();
```

### 4-3. 검증 규칙 매핑

기존 `validators.ts` 함수를 react-hook-form `validate` 옵션으로 연결합니다. validators.ts 자체는 수정하지 않습니다.

```typescript
// 패턴: validator가 에러 메시지를 반환하면 에러, undefined면 통과
register('email', {
  required: ERROR_MESSAGES.EMAIL_REQUIRED,
  validate: (value) => {
    const error = validateEmail(value);
    return error || true; // 에러 메시지 또는 true(통과)
  },
});

register('password', {
  required: ERROR_MESSAGES.PASSWORD_REQUIRED,
  validate: (value) => {
    const error = validatePassword(value);
    return error || true;
  },
});

register('name', {
  required: ERROR_MESSAGES.NAME_REQUIRED,
  validate: (value) => {
    const error = validateName(value);
    return error || true;
  },
});
```

### 4-4. 삭제 대상

- `src/hooks/useFormInput.ts`

---

## Phase 5: 페이지 컴포넌트 리팩토링

### 전환 순서 (의존도 순)

1. **login/page.tsx** - Redux 사용 가장 많음, 기준 패턴 확립
2. **register/page.tsx** - 로그인과 유사한 패턴
3. **forgot-password/page.tsx** - 단순 폼
4. **reset-password/page.tsx** - 단순 폼
5. **email-verify/resend/page.tsx** - 단순 폼
6. **email-verify/page.tsx** - mutation만 사용 (폼 없음)
7. **account-merge/request/page.tsx** - query + mutation
8. **account-merge/confirm/page.tsx** - query + mutation
9. **settings/accounts/page.tsx** - query + mutation

### 각 페이지 변경 패턴

```typescript
// Before (공통 패턴)
const dispatch = useAppDispatch();
const { isLoading, error } = useAppSelector((state) => state.auth);
const { values, errors, handleChange, setError } = useFormInput({ ... });
const [isRetrying, setIsRetrying] = useState(false);
const [retryCount, setRetryCount] = useState(0);
const [lastError, setLastError] = useState<AuthError | null>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  // 수동 검증
  // dispatch(thunk) 또는 service 직접 호출
  // try-catch로 에러 처리
  // 수동 상태 업데이트
};

// After (공통 패턴)
const { register, handleSubmit, formState: { errors } } = useForm({ ... });
const mutation = useSomeMutation();

const onSubmit = handleSubmit((data) => {
  mutation.mutate(data, {
    onSuccess: (response) => { /* 리다이렉트 등 */ },
  });
});

// 템플릿에서:
// mutation.isPending → 로딩 상태
// mutation.error → 에러 표시
// mutation.isSuccess → 성공 상태
```

---

## Phase 6: 정리

### 삭제 파일

| 파일 | 이유 |
|------|------|
| `src/store/index.ts` | Redux store 설정 → Zustand로 대체 |
| `src/store/hooks.ts` | useAppDispatch/useAppSelector → 불필요 |
| `src/store/slices/authSlice.ts` | authSlice → react-query + Zustand로 분리 |
| `src/hooks/useFormInput.ts` | → react-hook-form으로 대체 |

### 생성 파일

| 파일 | 역할 |
|------|------|
| `src/store/authStore.ts` | Zustand 클라이언트 상태 (loginAttempts) |
| `src/hooks/mutations/useLogin.ts` | 로그인 mutation |
| `src/hooks/mutations/useSignup.ts` | 회원가입 mutation |
| `src/hooks/mutations/useForgotPassword.ts` | 비밀번호 찾기 mutation |
| `src/hooks/mutations/useResetPassword.ts` | 비밀번호 재설정 mutation |
| `src/hooks/mutations/useVerifyEmail.ts` | 이메일 인증 mutation |
| `src/hooks/mutations/useResendVerification.ts` | 인증 재전송 mutation |
| `src/hooks/mutations/useInitiateMerge.ts` | 계정 병합 요청 mutation |
| `src/hooks/mutations/useConfirmMerge.ts` | 계정 병합 승인 mutation |
| `src/hooks/mutations/useRejectMerge.ts` | 계정 병합 거절 mutation |
| `src/hooks/mutations/useUnlinkAccount.ts` | OAuth 연결 해제 mutation |
| `src/hooks/queries/useAuthInitialize.ts` | 인증 초기화 query |
| `src/hooks/queries/useVerifyMergeToken.ts` | 병합 토큰 검증 query |
| `src/hooks/queries/useLinkedAccounts.ts` | 연결 계정 목록 query |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/providers.tsx` | Redux Provider → QueryClientProvider |
| `src/components/form/FormInput.tsx` | registration prop 추가 |
| `src/app/login/page.tsx` | useForm + useLogin + useAuthStore |
| `src/app/register/page.tsx` | useForm + useSignup |
| `src/app/forgot-password/page.tsx` | useForm + useForgotPassword |
| `src/app/reset-password/page.tsx` | useForm + useResetPassword |
| `src/app/email-verify/page.tsx` | useVerifyEmail |
| `src/app/email-verify/resend/page.tsx` | useForm + useResendVerification |
| `src/app/account-merge/request/page.tsx` | useAuthInitialize + useInitiateMerge |
| `src/app/account-merge/confirm/page.tsx` | useVerifyMergeToken + useAuthInitialize + useConfirmMerge + useRejectMerge |
| `src/app/settings/accounts/page.tsx` | useAuthInitialize + useLinkedAccounts + useUnlinkAccount |
| `package.json` | 의존성 변경 |

### 유지 파일 (변경 없음)

- `src/services/*` - 서비스 레이어 그대로 유지
- `src/utils/validators.ts` - 검증 함수 그대로 활용
- `src/utils/oauthErrorMapper.ts` - OAuth 에러 매핑 유지
- `src/utils/providerMapper.ts` - 프로바이더 매핑 유지
- `src/config/constants.ts` - 상수 유지
- `src/lib/errorConverter.ts` - 에러 변환 유지
- `src/lib/httpClient.ts` - HTTP 클라이언트 유지
- `src/hooks/useOAuthErrorHandling.ts` - OAuth 에러 처리 유지
- `src/components/common/*` - 공통 컴포넌트 유지
- `src/components/form/FormError.tsx` - 에러 표시 유지
- `src/components/form/SubmitButton.tsx` - 버튼 유지
- `src/components/OAuthEmailDuplicateError.tsx` - OAuth 에러 컴포넌트 유지
- `src/types/index.ts` - 타입 정의 유지
