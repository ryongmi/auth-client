# CLAUDE.md - Auth Client

이 파일은 auth-client 작업 시 Claude Code의 가이드라인을 제공합니다.

## 프로젝트 개요

auth-client는 krgeobuk 생태계의 중앙 인증 서비스로, auth.krgeobuk.com에서 서비스됩니다. SSO(Single Sign-On) 허브 역할을 담당하며, 모든 krgeobuk 서비스의 사용자 인증을 통합 관리합니다.

### 아키텍처 특징
- **독립적 인증 서비스**: 다른 서비스와 완전히 분리된 인증 전용 애플리케이션
- **SSO 허브**: 중앙 집중식 인증을 통한 서비스 간 seamless 연동
- **Next.js 15**: App Router 기반의 최신 React 아키텍처
- **Redux Toolkit**: 복잡한 인증 상태 관리
- **강화된 에러 처리**: 포괄적인 네트워크 오류 처리 및 자동 재시도 시스템

## 핵심 명령어

### 개발
```bash
# 개발 서버 시작 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 타입 검사
npm run type-check
```

### 코드 품질
```bash
# 린팅
npm run lint

# 자동 lint 수정
npm run lint --fix
```

### Docker
```bash
# 이미지 빌드
docker build -t auth-client .

# 컨테이너 실행 (포트 3000에서 서비스)
docker run -p 3000:3000 --env-file .env.local auth-client
```

## 개발 표준

### 1. Next.js 15 App Router 패턴
auth-client는 [portal-client/CLAUDE.md](../portal-client/CLAUDE.md)의 **"Next.js 15 & React 개발 표준"**을 준수합니다.

### 2. 인증 특화 패턴

#### 페이지 구조
```typescript
// 인증 페이지는 클라이언트 컴포넌트로 구현
'use client';

export default function LoginPage(): JSX.Element {
  // SSO 파라미터 처리
  const searchParams = useSearchParams();
  const redirectSession = searchParams.get('redirect-session');
  const redirectUri = searchParams.get('redirect-uri');
  
  // 인증 상태 관리
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  return (
    // UI 구현
  );
}
```

#### 서비스 레이어 패턴
```typescript
// 인증 서비스는 싱글톤 패턴으로 관리
export class AuthService {
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    // auth-server API 호출
  }
  
  async handleGoogleCallback(code: string, state: string): Promise<{ redirectUrl?: string }> {
    // OAuth 콜백 처리
  }
}

export const authService = new AuthService();
```

#### Redux 상태 관리
```typescript
// createAsyncThunk를 사용한 비동기 액션
export const loginUser = createAsyncThunk<LoginResponse, LoginRequest>(
  'auth/login',
  async (loginData, { rejectWithValue }) => {
    try {
      return await authService.login(loginData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '로그인 실패');
    }
  }
);
```

### 3. SSO 통합 패턴

#### SSO 서비스 구조
```typescript
export class SSOService {
  // SSO 세션 생성
  async initiateSSORedirect(targetService: string, returnUrl?: string): Promise<void>
  
  // SSO 로그인 처리
  async processSSOLogin(loginData: LoginRequest, sessionId: string): Promise<string>
  
  // 글로벌 로그아웃
  async globalLogout(): Promise<void>
  
  // 크로스 도메인 쿠키 관리
  private setAuthCookies(tokens: TokenPair): void
}
```

#### 크로스 도메인 인증
```typescript
// .krgeobuk.com 도메인 쿠키 설정
document.cookie = `krgeobuk_access_token=${token}; domain=.krgeobuk.com; secure; samesite=strict`;
```

### 4. 에러 처리 시스템

#### HTTP 클라이언트 에러 처리
```typescript
// httpClient.ts에서 자동 에러 분류 및 처리
const errorResponse = {
  code: 'NETWORK_ERROR',
  message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
  statusCode: 0,
  isRetryable: true, // 재시도 가능 여부
};
```

#### 자동 재시도 메커니즘
```typescript
// 지수 백오프 재시도 (최대 2회)
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1초
  retryableErrors: ['TIMEOUT_ERROR', 'NETWORK_ERROR', 'SERVER_ERROR', 'TOO_MANY_REQUESTS'],
};

// 재시도 로직
const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
await new Promise(resolve => setTimeout(resolve, delay));
```

#### 사용자 친화적 에러 표시
```typescript
// 에러 상태별 적절한 UI 표시
{errors.submit && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start">
      <svg className="w-5 h-5 text-red-500 mr-2">...</svg>
      <div className="flex-1">
        <p className="text-sm text-red-800 font-medium">
          {errors.submit}
        </p>
        
        {/* 재시도 가능한 에러인 경우 재시도 버튼 표시 */}
        {lastError?.isRetryable && (
          <button onClick={handleRetry} disabled={isRetrying}>
            다시 시도
          </button>
        )}
      </div>
    </div>
  </div>
)}
```

#### 수동 재시도 구현
```typescript
// 컴포넌트별 수동 재시도 패턴
const handleRetry = async (): Promise<void> => {
  if (!lastError || !lastError.isRetryable) return;

  setIsRetrying(true);
  setErrors({});

  try {
    await dispatch(authAction(formData)).unwrap();
    setLastError(null);
  } catch (retryError: any) {
    setLastError(retryError);
    setErrors({ submit: retryError.message });
  } finally {
    setIsRetrying(false);
  }
};
```

### 5. 보안 구현 표준

#### 입력 검증
```typescript
// 클라이언트 사이드 보안 검증
const suspiciousPatterns = [
  /['\"]/g,
  /union\s+select/i,
  /or\s+1\s*=\s*1/i,
  /<script/i,
  /javascript:/i,
];

if (suspiciousPatterns.some(pattern => pattern.test(value))) {
  setErrors(prev => ({
    ...prev,
    [name]: '잘못된 입력 형식입니다.'
  }));
  return;
}
```

#### Honeypot 구현
```typescript
// 봇 탐지용 숨겨진 필드
<input
  ref={honeypotRef}
  type="text"
  name="website"
  tabIndex={-1}
  autoComplete="off"
  style={{
    position: 'absolute',
    left: '-9999px',
    opacity: 0,
    pointerEvents: 'none'
  }}
  aria-hidden="true"
/>

// 폼 검증 시 Honeypot 확인
if (honeypotRef.current?.value) {
  newErrors.submit = '비정상적인 요청이 감지되었습니다.';
  return false;
}
```

#### Rate Limiting 표시
```typescript
// 로그인 시도 횟수 관리
const [remainingAttempts, setRemainingAttempts] = useState(5);

// 경고 표시
{remainingAttempts <= 2 && remainingAttempts > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-sm text-yellow-800">
      <strong>경고:</strong> 남은 로그인 시도 횟수: {remainingAttempts}회
    </p>
  </div>
)}
```

### 6. OAuth 콜백 처리

#### 표준 콜백 페이지 구조
```typescript
export default function GoogleCallbackPage(): JSX.Element {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        // 에러 체크
        if (searchParams.get('error')) {
          throw new Error('OAuth 인증이 취소되었습니다');
        }
        
        // 콜백 처리
        const response = await authService.handleGoogleCallback(code, state);
        
        // 리다이렉트 처리
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        }
      } catch (error) {
        setStatus('error');
        // 에러 시 로그인 페이지로 리다이렉트
      }
    };
    
    handleCallback();
  }, []);
  
  // 상태별 UI 렌더링
}
```

## 환경 설정

### 환경 변수 구성
```bash
# auth-server 연동 (필수)
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000

# SSO 도메인 설정
NEXT_PUBLIC_DOMAIN=krgeobuk.com

# 애플리케이션 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 개발 환경 설정
NODE_ENV=development
```

### 추가 환경 변수 (프로덕션)
```bash
# 프로덕션 환경
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# 보안 강화
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth-server.krgeobuk.com
NEXT_PUBLIC_DOMAIN=krgeobuk.com
```

### Next.js 설정
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone', // Docker 지원
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
        ]
      }
    ];
  }
};
```

## 서비스 연동

### auth-server API 통신
```typescript
// HTTP 클라이언트 설정 (httpClient.ts)
const authClientConfig: HttpClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true, // HTTP-only 쿠키 지원
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

// 자동 재시도 시스템 포함
export const apiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    requestWithRetry(() => axiosInstance.get<ApiResponse<T>>(url, config)),
    
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    requestWithRetry(() => axiosInstance.post<ApiResponse<T>>(url, data, config)),
};
```

### 주요 API 엔드포인트 (실제 구현됨)
- `POST /auth/login` - 일반 로그인
- `POST /auth/signup` - 회원가입  
- `POST /auth/logout` - 로그아웃
- `POST /auth/forgot-password` - 비밀번호 찾기
- `POST /auth/reset-password` - 비밀번호 재설정
- `POST /auth/verify-email/request` - 이메일 인증 요청
- `POST /auth/verify-email/confirm` - 이메일 인증 확인
- `GET /oauth/login-google` - Google OAuth 시작 (쿼리 파라미터: redirect_session)
- `GET /oauth/login-naver` - Naver OAuth 시작 (쿼리 파라미터: redirect_session)
- `POST /auth/sso/login` - SSO 로그인 (sessionId 포함)

## 개발 워크플로우

### 1. 기능 개발 순서
1. **타입 정의**: `src/types/index.ts`에 필요한 타입 추가
2. **서비스 로직**: `src/services/`에 비즈니스 로직 구현
3. **Redux 상태**: `src/store/slices/`에 상태 관리 로직 추가
4. **페이지 구현**: `src/app/`에 UI 컴포넌트 구현
5. **테스트**: 로컬 환경에서 기능 검증

### 2. 코드 품질 체크
- **타입 안전성**: `npm run type-check` 통과
- **린팅**: ESLint 규칙 준수 (`npm run lint`)
- **보안**: 입력 검증, Honeypot, Rate limiting
- **에러 처리**: 자동 재시도 및 사용자 친화적 메시지
- **성능**: React.memo, useMemo, useCallback 적절히 사용

### 3. 통합 테스트
- **auth-server 연동**: API 엔드포인트 호출 확인
- **OAuth 플로우**: Google/Naver 로그인 테스트
- **SSO 리다이렉트**: 다른 서비스 간 인증 상태 동기화
- **에러 처리**: 네트워크 오류 시 재시도 동작 확인
- **보안**: Honeypot, Rate limiting 동작 확인

## 문제 해결

### 공통 이슈

#### 1. CORS 에러
- auth-server의 CORS 설정 확인
- 쿠키 `withCredentials` 설정 검증

#### 2. OAuth 콜백 실패
- auth-server OAuth 설정 확인
- 리다이렉트 URI 일치 여부 검증
- 상태 값(state) 유효성 검사

#### 3. 에러 처리 관련 문제
- **자동 재시도 실패**: RETRY_CONFIG 설정 및 isRetryable 플래그 확인
- **수동 재시도 버튼 미표시**: lastError?.isRetryable 조건 검증
- **에러 메시지 미표시**: httpClient.ts 에러 인터셉터 로직 확인

#### 4. SSO 쿠키 문제
- 도메인 설정 확인 (`.krgeobuk.com`)
- Secure/SameSite 설정 검증
- 브라우저 개발자 도구에서 쿠키 확인

### 디버깅 도구
- **브라우저 개발자 도구**: 네트워크, 쿠키, 콘솔 확인
- **Redux DevTools**: 상태 변화 추적
- **auth-server 로그**: 백엔드 에러 확인
- **에러 처리 로그**: 개발 환경에서 httpClient.ts 에러 로깅 확인

## 보안 고려사항

### 클라이언트 보안
- **입력 검증**: SQL injection, XSS 방지
- **Rate Limiting**: 로그인 시도 제한
- **Honeypot**: 봇 탐지
- **CSRF 보호**: 토큰 기반 검증

### 인증 보안  
- **JWT 토큰**: 짧은 만료 시간 (15분)
- **Refresh Token**: 장기 토큰 (7일)
- **Secure Cookies**: HttpOnly, Secure, SameSite
- **도메인 격리**: 서비스별 독립 보안

## 참조 문서

- **공통 Next.js 표준**: [portal-client/CLAUDE.md](../portal-client/CLAUDE.md)
- **NestJS 서버 표준**: [authz-server/CLAUDE.md](../authz-server/CLAUDE.md)
- **전체 아키텍처**: [CLAUDE.md](../CLAUDE.md)

---

auth-client는 krgeobuk 생태계의 핵심 인증 서비스로, 높은 보안성과 사용자 경험을 제공해야 합니다.