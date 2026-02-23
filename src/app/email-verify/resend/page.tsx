'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useResendVerification } from '@/hooks/mutations/useResendVerification';
import { validateEmail } from '@/utils/validators';
import {
  FormInput,
  FormInputIcons,
  FormError,
  SubmitButton,
  SubmitButtonIcons,
} from '@/components/form';
import { Alert, AuthPageLayout } from '@/components/common';

interface ResendFormData {
  email: string;
}

export default function EmailVerifyResendPage(): React.JSX.Element {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResendFormData>({
    defaultValues: { email: '' },
  });

  const router = useRouter();
  const resendMutation = useResendVerification();

  const onSubmit = (data: ResendFormData): void => {
    resendMutation.mutate(data.email);
  };

  return (
    <AuthPageLayout>
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

        {resendMutation.isSuccess ? (
          <div className="space-y-4">
            <Alert type="success" title="메일 발송 완료">
              <p className="text-sm text-green-700">
                <strong>{getValues('email')}</strong>로 인증 메일이 발송되었습니다.
              </p>
              <p className="text-sm text-green-700 mt-2">
                메일함을 확인하시고 인증 링크를 클릭해주세요.
              </p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-green-800 font-medium mb-1">안내사항</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 인증 링크는 24시간 동안 유효합니다.</li>
                  <li>• 메일이 오지 않는다면 스팸함을 확인해주세요.</li>
                  <li>• 재발송은 1분에 최대 3번까지 가능합니다.</li>
                </ul>
              </div>
            </Alert>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              로그인 페이지로 이동
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="이메일 주소"
              type="email"
              registration={register('email', {
                validate: (value) => {
                  const result = validateEmail(value);
                  return result.isValid || result.error || true;
                },
              })}
              placeholder="example@email.com"
              error={errors.email?.message}
              icon={FormInputIcons.Email}
              disabled={resendMutation.isPending}
            />

            {resendMutation.error && (
              <FormError
                message={resendMutation.error.message}
                error={resendMutation.error}
                onRetry={() => resendMutation.reset()}
              />
            )}

            <SubmitButton
              isLoading={resendMutation.isPending}
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
    </AuthPageLayout>
  );
}
