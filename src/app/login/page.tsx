"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { authService } from "@/services/authService";
import { AuthError } from "@/types";

function LoginPageContent(): React.JSX.Element {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [redirectSession, setRedirectSession] = useState<string | null>(null);
  const [isSSO, setIsSSO] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  // const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const { isLoading, error, isBlocked, loginAttempts } = useAppSelector(
    (state) => state.auth
  );

  // SSO 리다이렉트 세션 확인
  useEffect(() => {
    // URL 파라미터에서 SSO 세션 정보 확인
    const session = searchParams.get("redirect_session");

    if (session) {
      // 세션 ID 유효성 검증
      if (!/^[a-zA-Z0-9_-]{20,}$/.test(session)) {
        setErrors({ submit: "잘못된 SSO 세션입니다." });
        return;
      }

      setRedirectSession(session);
      setIsSSO(true);
    }

    // 로그인 시도 횟수 확인
    setRemainingAttempts(Math.max(0, 5 - loginAttempts));
  }, [searchParams, loginAttempts]);

  // 에러 상태 정리
  useEffect(() => {
    if (error) {
      setErrors({ submit: error });
      setLastError(null); // Redux 에러 우선
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // 수동 재시도 함수
  const handleRetry = async (): Promise<void> => {
    if (!lastError || !lastError.isRetryable) return;

    setIsRetrying(true);
    setErrors({});
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
      setErrors({ submit: authRetryError.message });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    // 기본 보안 검증
    if (value.length > 254) {
      setErrors((prev) => ({
        ...prev,
        [name]: "입력값이 너무 깁니다.",
      }));
      return;
    }

    // 의심스러운 패턴 감지
    const suspiciousPatterns = [
      /['"]/g,
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /<script/i,
      /javascript:/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
      setErrors((prev) => ({
        ...prev,
        [name]: "잘못된 입력 형식입니다.",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));

    // 입력 시 에러 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Honeypot 검사 (봇 탐지)
    if (honeypotRef.current?.value) {
      newErrors.submit = "비정상적인 요청이 감지되었습니다.";
      return false;
    }

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요";
    } else {
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "올바른 이메일 형식을 입력해주세요";
      } else if (formData.email.length > 254) {
        newErrors.email = "이메일 주소가 너무 깁니다";
      }
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다";
    } else if (formData.password.length > 128) {
      newErrors.password = "비밀번호가 너무 깁니다";
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
      const remaining = Math.max(0, 5 - loginAttempts - 1);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 - 간소화 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">로그인</h1>
        </div>

        {/* SSO 알림 */}
        {isSSO && (
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 0l4-4m6 6l-3 3a2 2 0 01-3 0l-3-3m-3 3a2 2 0 01-3 0l-3-3m3-3l3 3"
                />
              </svg>
              <p className="text-sm text-blue-700 font-medium">
                연결된 서비스로 자동 이동합니다
              </p>
            </div>
          </div>
        )}

        {/* 로그인 폼 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
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
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                이메일 주소
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.email
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="이메일을 입력하세요"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.password
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

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

            {/* 향상된 에러 표시 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">
                      {errors.submit}
                    </p>
                    
                    {/* 재시도 가능한 에러인 경우 재시도 버튼 표시 */}
                    {lastError?.isRetryable && (
                      <div className="mt-3 flex items-center space-x-3">
                        <button
                          onClick={handleRetry}
                          disabled={isRetrying}
                          className="text-sm text-red-700 hover:text-red-900 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isRetrying ? (
                            <>
                              <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              재시도 중...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              다시 시도
                            </>
                          )}
                        </button>
                        {retryCount > 0 && (
                          <span className="text-xs text-red-600">
                            ({retryCount}번째 재시도)
                          </span>
                        )}
                      </div>
                    )}

                    {/* 네트워크 에러인 경우 추가 안내 */}
                    {lastError?.code === 'NETWORK_ERROR' && (
                      <div className="mt-2 text-xs text-red-600">
                        • 인터넷 연결을 확인해주세요<br/>
                        • 방화벽이나 보안 프로그램이 차단하는지 확인해주세요
                      </div>
                    )}

                    {/* 서버 에러인 경우 추가 안내 */}
                    {lastError?.code === 'SERVER_ERROR' && (
                      <div className="mt-2 text-xs text-red-600">
                        • 서버 점검 중일 수 있습니다<br/>
                        • 잠시 후 다시 시도해주세요
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limit 경고 */}
            {remainingAttempts <= 2 && remainingAttempts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-yellow-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    <strong>경고:</strong> 남은 로그인 시도 횟수:{" "}
                    {remainingAttempts}회
                  </p>
                </div>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading || isBlocked || isRetrying}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isBlocked ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                    />
                  </svg>
                  일시적으로 차단됨
                </>
              ) : isLoading || isRetrying ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isRetrying ? '재시도 중...' : '로그인 중...'}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  로그인
                </>
              )}
            </button>
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
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
