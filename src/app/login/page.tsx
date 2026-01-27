"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { authService } from "@/services/authService";
import { AuthError } from "@/types";
import { OAuthEmailDuplicateError } from "@/components/OAuthEmailDuplicateError";
import { useOAuthErrorHandling } from "@/hooks/useOAuthErrorHandling";
import { useFormInput } from "@/hooks/useFormInput";
import { AUTH_CONFIG, ERROR_MESSAGES } from "@/config/constants";
import {
  validateEmail,
  validatePassword,
  validateSessionId,
} from "@/utils/validators";
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from "@/components/form";
import { Alert, AuthPageLayout, AuthPageFallback, FormCard } from "@/components/common";

function LoginPageContent(): React.JSX.Element {
  // 폼 입력 관리
  const {
    values: formData,
    errors,
    handleChange,
    setError,
    setErrors,
    clearAllErrors,
  } = useFormInput(
    { email: "", password: "" },
    { validateOnChange: true, trimOnChange: true }
  );

  const [redirectSession, setRedirectSession] = useState<string | null>(null);
  const [isSSO, setIsSSO] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(AUTH_CONFIG.LOGIN_MAX_ATTEMPTS);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const { isLoading, error, isBlocked, loginAttempts } = useAppSelector(
    (state) => state.auth
  );

  // OAuth 에러 처리 훅
  const {
    oauthEmailDuplicateDetails,
    errorMessage: oauthErrorMessage,
    clearEmailDuplicateDetails,
    clearErrorMessage,
  } = useOAuthErrorHandling();

  // SSO 리다이렉트 세션 확인
  useEffect(() => {
    // URL 파라미터에서 SSO 세션 정보 확인
    const session = searchParams.get("redirect_session");

    if (session) {
      // 세션 ID 유효성 검증
      const sessionValidation = validateSessionId(session);
      if (!sessionValidation.isValid) {
        setError("submit", sessionValidation.error || ERROR_MESSAGES.INVALID_SSO_SESSION);
        return;
      }

      setRedirectSession(session);
      setIsSSO(true);
    }

    // 로그인 시도 횟수 확인
    setRemainingAttempts(Math.max(0, AUTH_CONFIG.LOGIN_MAX_ATTEMPTS - loginAttempts));
  }, [searchParams, loginAttempts, setError]);

  // OAuth 에러 메시지를 폼 에러로 동기화
  useEffect(() => {
    if (oauthErrorMessage) {
      setError("submit", oauthErrorMessage);
      clearErrorMessage();
    }
  }, [oauthErrorMessage, clearErrorMessage, setError]);

  // 에러 상태 정리
  useEffect(() => {
    if (error) {
      setError("submit", error);
      setLastError(null); // Redux 에러 우선
      dispatch(clearError());
    }
  }, [error, dispatch, setError]);

  // 수동 재시도 함수
  const handleRetry = async (): Promise<void> => {
    if (!lastError || !lastError.isRetryable) return;

    setIsRetrying(true);
    clearAllErrors();
    setRetryCount(prev => prev + 1);

    try {
      const loginResponse = await dispatch(
        loginUser({
          loginData: formData,
          ...(redirectSession && { redirectSession }),
        })
      ).unwrap();

      window.location.href = loginResponse.redirectUrl || "/";
      setLastError(null);
      setRetryCount(0);
    } catch (retryError) {
      const authRetryError = retryError as AuthError;
      setLastError(authRetryError);
      setError("submit", authRetryError.message);
    } finally {
      setIsRetrying(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Honeypot 검사 (봇 탐지)
    if (honeypotRef.current?.value) {
      newErrors.submit = ERROR_MESSAGES.SUSPICIOUS_REQUEST;
      return false;
    }

    // 이메일 유효성 검사
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid && emailValidation.error) {
      newErrors.email = emailValidation.error;
    }

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      newErrors.password = passwordValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // 로그인 처리 (SSO와 일반 로그인 통합)
      const loginResponse = await dispatch(
        loginUser({
          loginData: formData,
          ...(redirectSession && { redirectSession }),
        })
      ).unwrap();

      window.location.href = loginResponse.redirectUrl || "/";
      setLastError(null);
    } catch (loginError) {
      // 에러는 Redux slice에서 처리되지만, 재시도 가능 여부도 확인
      const authLoginError = loginError as AuthError;
      setLastError(authLoginError);
      const remaining = Math.max(0, AUTH_CONFIG.LOGIN_MAX_ATTEMPTS - loginAttempts - 1);
      setRemainingAttempts(remaining);
    }
  };

  // Google 로그인 처리
  const handleGoogleLogin = (): void => {
    const redirectSession = searchParams.get("redirect_session");
    const googleUrl = authService.getGoogleLoginUrl(
      redirectSession || undefined
    );
    window.location.href = googleUrl;
  };

  // Naver 로그인 처리
  const handleNaverLogin = (): void => {
    const redirectSession = searchParams.get("redirect_session");
    const naverUrl = authService.getNaverLoginUrl(redirectSession || undefined);
    window.location.href = naverUrl;
  };

  return (
    <AuthPageLayout variant="form">
        {/* 헤더 - 간소화 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">로그인</h1>
        </div>

        {/* SSO 알림 */}
        {isSSO && (
          <Alert
            type="info"
            message="연결된 서비스로 자동 이동합니다"
            centered
          />
        )}

        {/* 로그인 폼 */}
        <FormCard>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot 필드 (봇 탐지용) */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                opacity: 0,
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />

            {/* 이메일 */}
            <FormInput
              name="email"
              label="이메일 주소"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              error={errors.email}
              icon={FormInputIcons.Email}
            />

            {/* 비밀번호 */}
            <FormInput
              name="password"
              label="비밀번호"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              error={errors.password}
              icon={FormInputIcons.Password}
            />

            {/* 로그인 유지 및 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-600"
                >
                  로그인 유지
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            {/* OAuth 이메일 중복 에러 상세 UI */}
            {oauthEmailDuplicateDetails && (
              <OAuthEmailDuplicateError
                details={oauthEmailDuplicateDetails}
                onLoginClick={() => {
                  clearEmailDuplicateDetails();
                  // 로그인 폼으로 스크롤 (이미 로그인 페이지이므로)
                }}
                onRetryClick={() => {
                  clearEmailDuplicateDetails();
                  router.push('/oauth');
                }}
                onMergeClick={() => {
                  // 계정 병합 요청 페이지로 이동
                  const params = new URLSearchParams({
                    provider: oauthEmailDuplicateDetails.attemptedProvider,
                    email: oauthEmailDuplicateDetails.email,
                  });
                  router.push(`/account-merge/request?${params.toString()}`);
                }}
              />
            )}

            {/* 향상된 에러 표시 (일반 에러용) */}
            {!oauthEmailDuplicateDetails && errors.submit && (
              <FormError
                message={errors.submit}
                error={lastError}
                onRetry={handleRetry}
                isRetrying={isRetrying}
                retryCount={retryCount}
              />
            )}

            {/* Rate Limit 경고 */}
            {remainingAttempts <= 2 && remainingAttempts > 0 && (
              <Alert
                type="warning"
                message={
                  <>
                    <strong>경고:</strong> 남은 로그인 시도 횟수:{" "}
                    {remainingAttempts}회
                  </>
                }
              />
            )}

            {/* 로그인 버튼 */}
            <SubmitButton
              isLoading={isLoading || isRetrying}
              loadingText={isRetrying ? '재시도 중...' : '로그인 중...'}
              isBlocked={isBlocked}
              icon={SubmitButtonIcons.Login}
            >
              로그인
            </SubmitButton>
          </form>

          {/* 구분선 */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  간편 로그인
                </span>
              </div>
            </div>
          </div>

          {/* 소셜 로그인 버튼 */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isBlocked}
              className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={handleNaverLogin}
              disabled={isBlocked}
              className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#03C75A"
                  d="M16.273 12.845 7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z"
                />
              </svg>
              Naver
            </button>
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              아직 계정이 없으신가요?{" "}
              <Link
                href={redirectSession ? `/register?redirect_session=${redirectSession}` : "/register"}
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>
        </FormCard>
    </AuthPageLayout>
  );
}

export default function LoginPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthPageFallback variant="form" />}>
      <LoginPageContent />
    </Suspense>
  );
}
