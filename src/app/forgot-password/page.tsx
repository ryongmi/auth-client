'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useForgotPassword } from '@/hooks/mutations/auth';
import { validateEmail } from '@/utils/validators';
import { StatusCard, StatusCardIcons, AuthPageLayout, FormCard } from '@/components/common';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';
import type { ForgotPasswordFormData } from '@/types';

export default function ForgotPasswordPage(): React.JSX.Element {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: { email: '' },
  });

  const forgotMutation = useForgotPassword();

  const onSubmit = (data: ForgotPasswordFormData): void => {
    forgotMutation.mutate(data);
  };

  const handleRetry = (): void => {
    if (!forgotMutation.error?.isRetryable) return;
    forgotMutation.mutate(getValues());
  };

  if (forgotMutation.isSuccess) {
    return (
      <AuthPageLayout variant="form">
        <FormCard>
          <StatusCard
              type="success"
              icon={StatusCardIcons.Check}
              title="이메일을 확인하세요"
              description={
                <>
                  <p>
                    비밀번호 재설정 링크를 <strong>{getValues('email')}</strong>로 발송했습니다.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    이메일을 받지 못하셨다면 스팸 폴더를 확인해 주세요.
                  </p>
                </>
              }
              actions={[
                {
                  label: '로그인 페이지로 돌아가기',
                  href: '/login',
                  variant: 'link',
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">비밀번호 재설정</h1>
          <p className="text-gray-600">등록된 이메일 주소를 입력해주세요</p>
        </div>

        {/* 비밀번호 찾기 폼 */}
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

            {/* 에러 표시 */}
            {forgotMutation.error && (
              <FormError
                message={forgotMutation.error.message}
                error={forgotMutation.error}
                onRetry={handleRetry}
                isRetrying={forgotMutation.isPending}
              />
            )}

            {/* 제출 버튼 */}
            <SubmitButton
              isLoading={forgotMutation.isPending}
              loadingText="전송 중..."
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
        </FormCard>
    </AuthPageLayout>
  );
}
