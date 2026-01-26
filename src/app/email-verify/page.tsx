'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';
import { StatusCard, StatusCardIcons } from '@/components/common';

function EmailVerifyContent(): React.JSX.Element {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyEmailToken = async (): Promise<void> => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setError('인증 토큰이 없습니다.');
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus('success');

        // 2초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (err) {
        const authError = err as AuthError;
        setStatus('error');
        setError(authError.message || '이메일 인증에 실패했습니다.');
      }
    };

    void verifyEmailToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">이메일 인증 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {status === 'success' && (
          <StatusCard
            type="success"
            icon={StatusCardIcons.Check}
            title="인증 완료!"
            description={
              <>
                <p>이메일 인증이 성공적으로 완료되었습니다.</p>
                <p className="text-sm text-gray-400 mt-2">
                  잠시 후 로그인 페이지로 이동합니다...
                </p>
              </>
            }
          />
        )}

        {status === 'error' && (
          <StatusCard
            type="error"
            icon={StatusCardIcons.Close}
            title="인증 실패"
            description={error || '이메일 인증에 실패했습니다.'}
            actions={[
              {
                label: '인증 메일 재발송',
                href: '/email-verify/resend',
              },
              {
                label: '로그인 페이지로 이동',
                href: '/login',
                variant: 'secondary',
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

export default function EmailVerifyPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <EmailVerifyContent />
    </Suspense>
  );
}
