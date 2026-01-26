'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { AuthError } from '@/types';
import { useFormInput } from '@/hooks/useFormInput';
import { validateEmail } from '@/utils/validators';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';

export default function ForgotPasswordPage(): React.JSX.Element {
  // 폼 입력 관리
  const {
    values: formData,
    errors,
    handleChange,
    setError,
    setErrors,
    clearAllErrors,
  } = useFormInput(
    { email: '' },
    { validateOnChange: true, trimOnChange: true }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 이메일 유효성 검사
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid && emailValidation.error) {
      newErrors.email = emailValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await authService.forgotPassword(formData);
      setSuccess(true);
      setLastError(null);
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError?.message || '요청 처리 중 오류가 발생했습니다';
      setError('submit', errorMessage);
      setLastError(authError);
    } finally {
      setIsLoading(false);
    }
  };

  // 수동 재시도 함수
  const handleRetry = async (): Promise<void> => {
    if (!lastError || !lastError.isRetryable) return;

    setIsRetrying(true);
    clearAllErrors();

    try {
      await authService.forgotPassword(formData);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
              <h2 className="text-2xl font-bold text-gray-700">이메일을 확인하세요</h2>
              <p className="text-gray-500">
                비밀번호 재설정 링크를 <strong>{formData.email}</strong>로 발송했습니다.
              </p>
              <p className="text-sm text-gray-400">
                이메일을 받지 못하셨다면 스팸 폴더를 확인해 주세요.
              </p>

              <div className="pt-4">
                <Link
                  href="/login"
                  className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  로그인 페이지로 돌아가기
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">비밀번호 재설정</h1>
          <p className="text-gray-600">등록된 이메일 주소를 입력해주세요</p>
        </div>

        {/* 비밀번호 찾기 폼 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              loadingText={isRetrying ? '재시도 중...' : '전송 중...'}
              icon={SubmitButtonIcons.Send}
            >
              재설정 링크 보내기
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
