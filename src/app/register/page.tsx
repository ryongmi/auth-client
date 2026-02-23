'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useSignup } from '@/hooks/mutations/useSignup';
import { ERROR_MESSAGES } from '@/config/constants';
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
import type { RegisterFormData } from '@/types';

function RegisterForm(): React.JSX.Element {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      nickname: '',
      agreedToTerms: false,
    },
  });

  const [redirectSession, setRedirectSession] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const signupMutation = useSignup();
  const password = watch('password');

  // SSO 리다이렉트 세션 및 내부 리다이렉트 경로 확인
  useEffect(() => {
    const session = searchParams.get('redirect_session');
    if (session) {
      setRedirectSession(session);
    }

    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      setRedirectPath(redirect);
    }
  }, [searchParams]);

  const handleRedirect = (redirectUrl?: string): void => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      const params = new URLSearchParams({ registered: 'true' });
      if (redirectPath) params.set('redirect', redirectPath);
      router.push(`/login?${params.toString()}`);
    }
  };

  const onSubmit = (data: RegisterFormData): void => {
    setSubmitError(null);

    signupMutation.mutate(
      {
        signupData: data,
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
    if (!signupMutation.error?.isRetryable) return;
    // re-trigger with current form values via handleSubmit
    void handleSubmit(onSubmit)();
  };

  return (
    <AuthPageLayout variant="form">
        {/* 헤더 - 간소화 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">새 계정 만들기</h1>
        </div>

        {/* 회원가입 폼 */}
        <FormCard>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 이메일 */}
            <FormInput
              label="이메일 주소"
              type="email"
              registration={register('email', {
                validate: (value) => {
                  const result = validateEmail(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="이메일을 입력하세요"
              error={errors.email?.message}
              icon={FormInputIcons.Email}
            />

            {/* 이름 */}
            <FormInput
              label="이름"
              type="text"
              registration={register('name', {
                validate: (value) => {
                  const result = validateName(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="이름을 입력하세요"
              error={errors.name?.message}
              icon={FormInputIcons.User}
            />

            {/* 닉네임 (선택사항) */}
            <FormInput
              label="닉네임"
              type="text"
              registration={register('nickname')}
              placeholder="닉네임을 입력하세요"
              labelSuffix={<span className="text-gray-400">(선택사항)</span>}
            />

            {/* 비밀번호 */}
            <FormInput
              label="비밀번호"
              type="password"
              registration={register('password', {
                validate: (value) => {
                  const result = validatePassword(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="비밀번호를 입력하세요"
              error={errors.password?.message}
              icon={FormInputIcons.Password}
            />

            {/* 비밀번호 확인 */}
            <FormInput
              label="비밀번호 확인"
              type="password"
              registration={register('confirmPassword', {
                validate: (value) => {
                  const result = validatePasswordConfirm(password, value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="비밀번호를 다시 입력하세요"
              error={errors.confirmPassword?.message}
              icon={FormInputIcons.Check}
            />

            {/* 이용약관 동의 */}
            <div>
              <div className="flex items-start">
                <input
                  id="agreedToTerms"
                  type="checkbox"
                  {...register('agreedToTerms', {
                    validate: (value) => value || ERROR_MESSAGES.TERMS_REQUIRED,
                  })}
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
                <p className="mt-2 text-sm text-red-600">{errors.agreedToTerms.message}</p>
              )}
            </div>

            {/* 향상된 에러 표시 */}
            {submitError && (
              <FormError
                message={submitError}
                error={signupMutation.error}
                onRetry={handleRetry}
                isRetrying={signupMutation.isPending}
              />
            )}

            {/* 회원가입 버튼 */}
            <SubmitButton
              isLoading={signupMutation.isPending}
              loadingText="가입 중..."
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
                href={((): string => {
                  const params = new URLSearchParams();
                  if (redirectSession) params.set('redirect_session', redirectSession);
                  if (redirectPath) params.set('redirect', redirectPath);
                  const query = params.toString();
                  return query ? `/login?${query}` : '/login';
                })()}
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
