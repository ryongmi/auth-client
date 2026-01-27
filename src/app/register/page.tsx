'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signupUser } from '@/store/slices/authSlice';
import { AuthError } from '@/types';
import { ERROR_MESSAGES } from '@/config/constants';
import { useFormInput } from '@/hooks/useFormInput';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateName,
} from '@/utils/validators';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';
import { AuthPageLayout, AuthPageFallback, FormCard } from '@/components/common';

function RegisterForm(): React.JSX.Element {
  // 폼 입력 관리
  const {
    values: formData,
    errors,
    handleChange,
    setError,
    setErrors,
    clearAllErrors,
  } = useFormInput(
    {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      nickname: '',
      agreedToTerms: false,
    },
    { validateOnChange: true }
  );

  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [redirectSession, setRedirectSession] = useState<string | null>(null);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // SSO 리다이렉트 세션 확인
  useEffect(() => {
    const session = searchParams.get('redirect_session');
    if (session) {
      setRedirectSession(session);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 이메일 유효성 검사
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid && emailValidation.error) {
      newErrors.email = emailValidation.error;
    }

    // 이름 유효성 검사
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid && nameValidation.error) {
      newErrors.name = nameValidation.error;
    }

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      newErrors.password = passwordValidation.error;
    }

    // 비밀번호 확인 유효성 검사
    const confirmValidation = validatePasswordConfirm(formData.password, formData.confirmPassword);
    if (!confirmValidation.isValid && confirmValidation.error) {
      newErrors.confirmPassword = confirmValidation.error;
    }

    // 약관 동의 확인
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = ERROR_MESSAGES.TERMS_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const signupResponse = await dispatch(
        signupUser({
          signupData: formData,
          ...(redirectSession && { redirectSession }),
        })
      ).unwrap();

      // 서버가 제공한 redirectUrl 사용 (SSO, OAuth 등 지원)
      if (signupResponse.redirectUrl) {
        window.location.href = signupResponse.redirectUrl;
      } else {
        // fallback: 로그인 페이지로 이동
        router.push('/login?registered=true');
      }

      setLastError(null);
    } catch (signupError) {
      // 에러는 Redux slice에서 처리되지만, 재시도 가능 여부도 확인
      const authSignupError = signupError as AuthError;
      setLastError(authSignupError);
    }
  };

  // 수동 재시도 함수
  const handleRetry = async (): Promise<void> => {
    if (!lastError || !lastError.isRetryable) return;

    setIsRetrying(true);
    clearAllErrors();

    try {
      const signupResponse = await dispatch(
        signupUser({
          signupData: formData,
          ...(redirectSession && { redirectSession }),
        })
      ).unwrap();

      // 서버가 제공한 redirectUrl 사용 (SSO, OAuth 등 지원)
      if (signupResponse.redirectUrl) {
        window.location.href = signupResponse.redirectUrl;
      } else {
        // fallback: 로그인 페이지로 이동
        router.push('/login?registered=true');
      }

      setLastError(null);
    } catch (retryError) {
      const authRetryError = retryError as AuthError;
      setLastError(authRetryError);
      setError("submit", authRetryError.message);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <AuthPageLayout variant="form">
        {/* 헤더 - 간소화 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">새 계정 만들기</h1>
        </div>

        {/* 회원가입 폼 */}
        <FormCard>
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

            {/* 이름 */}
            <FormInput
              name="name"
              label="이름"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              error={errors.name}
              icon={FormInputIcons.User}
            />

            {/* 닉네임 (선택사항) */}
            <FormInput
              name="nickname"
              label="닉네임"
              type="text"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임을 입력하세요"
              labelSuffix={<span className="text-gray-400">(선택사항)</span>}
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

            {/* 이용약관 동의 */}
            <div>
              <div className="flex items-start">
                <input
                  id="agreedToTerms"
                  name="agreedToTerms"
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="agreedToTerms" className="ml-2 block text-sm text-gray-600">
                  <Link href="#" className="text-blue-500 hover:text-blue-400">
                    이용약관
                  </Link>{' '}
                  및{' '}
                  <Link href="#" className="text-blue-500 hover:text-blue-400">
                    개인정보처리방침
                  </Link>
                  에 동의합니다.
                </label>
              </div>
              {errors.agreedToTerms && (
                <p className="mt-2 text-sm text-red-600">{errors.agreedToTerms}</p>
              )}
            </div>

            {/* 향상된 에러 표시 */}
            {error && (
              <FormError
                message={error}
                error={lastError}
                onRetry={handleRetry}
                isRetrying={isRetrying}
              />
            )}

            {/* 회원가입 버튼 */}
            <SubmitButton
              isLoading={isLoading || isRetrying}
              loadingText={isRetrying ? '재시도 중...' : '가입 중...'}
              icon={SubmitButtonIcons.Signup}
            >
              회원가입
            </SubmitButton>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <Link
                href={redirectSession ? `/login?redirect_session=${redirectSession}` : '/login'}
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </FormCard>
    </AuthPageLayout>
  );
}

export default function RegisterPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthPageFallback variant="form" />}>
      <RegisterForm />
    </Suspense>
  );
}
