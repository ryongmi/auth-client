'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';
import { useFormInput } from '@/hooks/useFormInput';
import { validateEmail } from '@/utils/validators';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';

export default function EmailVerifyResendPage(): React.JSX.Element {
  // 폼 입력 관리
  const {
    values: formData,
    errors,
    handleChange,
    setError,
    clearAllErrors,
  } = useFormInput(
    { email: '' },
    { validateOnChange: true, trimOnChange: true }
  );

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    clearAllErrors();

    // 이메일 검증
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setError('email', emailValidation.error || '올바른 이메일 형식이 아닙니다.');
      return;
    }

    setStatus('loading');

    try {
      await authService.requestEmailVerification(formData.email);
      setStatus('success');
      setLastError(null);
    } catch (err) {
      const authError = err as AuthError;
      setStatus('error');
      setError('submit', authError.message || '인증 메일 발송에 실패했습니다.');
      setLastError(authError);
    }
  };

  const handleRetry = (): void => {
    setStatus('idle');
    clearAllErrors();
    setLastError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">인증 메일 재발송</h1>
          <p className="text-gray-600">가입하신 이메일 주소로 인증 링크를 다시 보내드립니다.</p>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 mr-3"
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
                <div>
                  <h3 className="font-medium text-green-800 mb-1">메일 발송 완료</h3>
                  <p className="text-sm text-green-700">
                    <strong>{formData.email}</strong>로 인증 메일이 발송되었습니다.
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    메일함을 확인하시고 인증 링크를 클릭해주세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">💡 안내사항</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 인증 링크는 24시간 동안 유효합니다.</li>
                <li>• 메일이 오지 않는다면 스팸함을 확인해주세요.</li>
                <li>• 재발송은 1분에 최대 3번까지 가능합니다.</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              로그인 페이지로 이동
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              name="email"
              label="이메일 주소"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              error={errors.email}
              icon={FormInputIcons.Email}
              disabled={status === 'loading'}
            />

            {errors.submit && (
              <FormError
                message={errors.submit}
                error={lastError}
                onRetry={handleRetry}
              />
            )}

            <SubmitButton
              isLoading={status === 'loading'}
              loadingText="발송 중..."
              icon={SubmitButtonIcons.Send}
            >
              인증 메일 발송
            </SubmitButton>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
              >
                로그인 페이지로 돌아가기
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
