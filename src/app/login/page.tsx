"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLogin } from "@/hooks/mutations/useLogin";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { OAuthEmailDuplicateError } from "@/components/OAuthEmailDuplicateError";
import { useOAuthErrorHandling } from "@/hooks/useOAuthErrorHandling";
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
import type { LoginFormData } from "@/types";

function LoginPageContent(): React.JSX.Element {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: "", password: "" },
  });

  const [redirectSession, setRedirectSession] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isSSO, setIsSSO] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const honeypotRef = useRef<HTMLInputElement>(null);

  const loginMutation = useLogin();
  const { loginAttempts, isBlocked } = useAuthStore();
  const remainingAttempts = Math.max(0, AUTH_CONFIG.LOGIN_MAX_ATTEMPTS - loginAttempts);

  // OAuth 에러 처리 훅
  const {
    oauthEmailDuplicateDetails,
    errorMessage: oauthErrorMessage,
    clearEmailDuplicateDetails,
    clearErrorMessage,
  } = useOAuthErrorHandling();

  // SSO 리다이렉트 세션 및 내부 리다이렉트 경로 확인
  useEffect(() => {
    const session = searchParams.get("redirect_session");

    if (session) {
      const sessionValidation = validateSessionId(session);
      if (!sessionValidation.isValid) {
        setSubmitError(sessionValidation.error || ERROR_MESSAGES.INVALID_SSO_SESSION);
        return;
      }

      setRedirectSession(session);
      setIsSSO(true);
    }

    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      setRedirectPath(redirect);
    }
  }, [searchParams]);

  // OAuth 에러 메시지를 폼 에러로 동기화
  useEffect(() => {
    if (oauthErrorMessage) {
      setSubmitError(oauthErrorMessage);
      clearErrorMessage();
    }
  }, [oauthErrorMessage, clearErrorMessage]);

  const handleRedirect = (redirectUrl?: string): void => {
    if (redirectSession && redirectUrl) {
      window.location.href = redirectUrl;
    } else if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      window.location.href = redirectUrl || "/";
    }
  };

  const onSubmit = (data: LoginFormData): void => {
    // Honeypot 검사 (봇 탐지)
    if (honeypotRef.current?.value) {
      setSubmitError(ERROR_MESSAGES.SUSPICIOUS_REQUEST);
      return;
    }

    setSubmitError(null);

    loginMutation.mutate(
      {
        loginData: data,
        ...(redirectSession && { redirectSession }),
      },
      {
        onSuccess: (response) => {
          handleRedirect(response.redirectUrl);
        },
        onError: (error) => {
          setSubmitError(error.message);
        },
      },
    );
  };

  const handleRetry = (): void => {
    const data = getValues();
    setSubmitError(null);

    loginMutation.mutate(
      {
        loginData: data,
        ...(redirectSession && { redirectSession }),
      },
      {
        onSuccess: (response) => {
          handleRedirect(response.redirectUrl);
        },
        onError: (error) => {
          setSubmitError(error.message);
        },
      },
    );
  };

  // Google 로그인 처리
  const handleGoogleLogin = (): void => {
    const session = searchParams.get("redirect_session");
    window.location.href = authService.getGoogleLoginUrl(session || undefined);
  };

  // Naver 로그인 처리
  const handleNaverLogin = (): void => {
    const session = searchParams.get("redirect_session");
    window.location.href = authService.getNaverLoginUrl(session || undefined);
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              label="이메일 주소"
              type="email"
              registration={register("email", {
                validate: (value) => {
                  const result = validateEmail(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="이메일을 입력하세요"
              error={errors.email?.message}
              icon={FormInputIcons.Email}
            />

            {/* 비밀번호 */}
            <FormInput
              label="비밀번호"
              type="password"
              registration={register("password", {
                validate: (value) => {
                  const result = validatePassword(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="비밀번호를 입력하세요"
              error={errors.password?.message}
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
                }}
                onRetryClick={() => {
                  clearEmailDuplicateDetails();
                  router.push('/oauth');
                }}
                onMergeClick={() => {
                  const params = new URLSearchParams({
                    provider: oauthEmailDuplicateDetails.attemptedProvider,
                    email: oauthEmailDuplicateDetails.email,
                  });
                  router.push(`/account-merge/request?${params.toString()}`);
                }}
              />
            )}

            {/* 향상된 에러 표시 (일반 에러용) */}
            {!oauthEmailDuplicateDetails && submitError && (
              <FormError
                message={submitError}
                error={loginMutation.error}
                onRetry={handleRetry}
                isRetrying={loginMutation.isPending}
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
              isLoading={loginMutation.isPending}
              loadingText="로그인 중..."
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
                href={((): string => {
                  const params = new URLSearchParams();
                  if (redirectSession) params.set("redirect_session", redirectSession);
                  if (redirectPath) params.set("redirect", redirectPath);
                  const query = params.toString();
                  return query ? `/register?${query}` : "/register";
                })()}
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
