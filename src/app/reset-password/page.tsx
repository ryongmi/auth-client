'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { AuthError } from '@/types';
import { useFormInput } from '@/hooks/useFormInput';
import { validatePassword, validatePasswordConfirm } from '@/utils/validators';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';

function ResetPasswordPageContent(): React.JSX.Element {
  // 폼 입력 관리
  const {
    values: formData,
    errors,
    handleChange,
    setError,
    setErrors,
    clearAllErrors,
  } = useFormInput(
    { password: '', confirmPassword: '' },
    { validateOnChange: true }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      router.push('/forgot-password');
      return;
    }

    // 토큰 유효성 기본 검증
    if (tokenParam.length < 10) {
      setError('submit', '유효하지 않은 재설정 링크입니다');
      return;
    }

    setToken(tokenParam);
  }, [searchParams, router, setError]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      newErrors.password = passwordValidation.error;
    }

    // 비밀번호 확인 유효성 검사
    const confirmValidation = validatePasswordConfirm(
      formData.password,
      formData.confirmPassword
    );
    if (!confirmValidation.isValid && confirmValidation.error) {
      newErrors.confirmPassword = confirmValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    try {
      setIsLoading(true);
      await authService.resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setLastError(null);
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage =
        authError?.message || '비밀번호 재설정 중 오류가 발생했습니다';
      setError('submit', errorMessage);
      setLastError(authError);
    } finally {
      setIsLoading(false);
    }
  };

  // 수동 재시도 함수
  const handleRetry = async (): Promise<void> => {
    if (!lastError || !lastError.isRetryable || !token) return;

    setIsRetrying(true);
    clearAllErrors();

    try {
      await authService.resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setLastError(null);
    } catch (retryError) {
      const authRetryError = retryError as AuthError;
      setLastError(authRetryError);
      setError('submit', authRetryError.message);
    } finally {
      setIsRetrying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md w-full space-y-8">
          {/* 성공 메시지 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-700">
                비밀번호 재설정 완료
              </h2>
              <p className="text-gray-500">
                새 비밀번호로 성공적으로 변경되었습니다.
              </p>

              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
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
                  로그인하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-gray-600">안전한 새 비밀번호를 입력해주세요</p>
        </div>

        {/* 비밀번호 재설정 폼 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 새 비밀번호 */}
            <FormInput
              name="password"
              label="새 비밀번호"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="새 비밀번호를 입력하세요"
              error={errors.password}
              icon={FormInputIcons.Password}
            />

            {/* 비밀번호 확인 */}
            <FormInput
              name="confirmPassword"
              label="비밀번호 확인"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              error={errors.confirmPassword}
              icon={FormInputIcons.Check}
            />

            {/* 비밀번호 요구사항 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                비밀번호 요구사항:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 최소 8자 이상</li>
                <li>• 대문자와 소문자 포함</li>
                <li>• 숫자 포함</li>
              </ul>
            </div>

            {/* 에러 표시 */}
            {errors.submit && (
              <FormError
                message={errors.submit}
                error={lastError}
                onRetry={handleRetry}
                isRetrying={isRetrying}
              />
            )}

            {/* 제출 버튼 */}
            <SubmitButton
              isLoading={isLoading || isRetrying}
              loadingText={isRetrying ? '재시도 중...' : '재설정 중...'}
              disabled={!token}
              icon={SubmitButtonIcons.Check}
            >
              비밀번호 재설정
            </SubmitButton>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              비밀번호가 기억나셨나요?{' '}
              <Link
                href="/login"
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
