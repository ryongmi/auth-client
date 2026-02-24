'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useResetPassword } from '@/hooks/mutations/auth';
import { validatePassword, validatePasswordConfirm } from '@/utils/validators';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';
import { StatusCard, StatusCardIcons, Alert, AuthPageLayout, AuthPageFallback, FormCard } from '@/components/common';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

function ResetPasswordPageContent(): React.JSX.Element {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const resetMutation = useResetPassword();
  const password = watch('password');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      router.push('/forgot-password');
      return;
    }

    if (tokenParam.length < 10) {
      setTokenError('유효하지 않은 재설정 링크입니다');
      return;
    }

    setToken(tokenParam);
  }, [searchParams, router]);

  const onSubmit = (data: ResetPasswordForm): void => {
    if (!token) return;

    resetMutation.mutate({ token, password: data.password });
  };

  const handleRetry = (): void => {
    if (!resetMutation.error?.isRetryable) return;
    void handleSubmit(onSubmit)();
  };

  if (resetMutation.isSuccess) {
    return (
      <AuthPageLayout variant="form">
        <FormCard>
          <StatusCard
              type="success"
              icon={StatusCardIcons.Check}
              title="비밀번호 재설정 완료"
              description="새 비밀번호로 성공적으로 변경되었습니다."
              actions={[
                {
                  label: '로그인하기',
                  href: '/login',
                },
              ]}
            />
        </FormCard>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout variant="form">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-gray-600">안전한 새 비밀번호를 입력해주세요</p>
        </div>

        {/* 비밀번호 재설정 폼 */}
        <FormCard>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 새 비밀번호 */}
            <FormInput
              label="새 비밀번호"
              type="password"
              registration={register('password', {
                validate: (value) => {
                  const result = validatePassword(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="새 비밀번호를 입력하세요"
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

            {/* 비밀번호 요구사항 */}
            <Alert
              type="info"
              title="비밀번호 요구사항:"
              items={[
                '최소 8자 이상',
                '대문자와 소문자 포함',
                '숫자 포함',
              ]}
            />

            {/* 에러 표시 */}
            {(resetMutation.error || tokenError) && (
              <FormError
                message={tokenError || resetMutation.error?.message || ''}
                error={resetMutation.error}
                onRetry={handleRetry}
                isRetrying={resetMutation.isPending}
              />
            )}

            {/* 제출 버튼 */}
            <SubmitButton
              isLoading={resetMutation.isPending}
              loadingText="재설정 중..."
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
        </FormCard>
    </AuthPageLayout>
  );
}

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthPageFallback variant="form" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
