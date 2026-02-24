'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyEmail } from '@/hooks/mutations/auth';
import { StatusCard, StatusCardIcons, AuthPageLayout, AuthPageFallback, LoadingSpinner } from '@/components/common';

function EmailVerifyContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verifyMutation = useVerifyEmail();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      return;
    }

    verifyMutation.mutate(token, {
      onSuccess: () => {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      },
    });
  }, [searchParams]);

  const token = searchParams.get('token');

  return (
    <AuthPageLayout>
      {!token && (
        <StatusCard
          type="error"
          icon={StatusCardIcons.Close}
          title="인증 실패"
          description="인증 토큰이 없습니다."
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

      {token && verifyMutation.isPending && <LoadingSpinner title="이메일 인증 중..." />}

      {verifyMutation.isSuccess && (
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

      {verifyMutation.isError && (
        <StatusCard
          type="error"
          icon={StatusCardIcons.Close}
          title="인증 실패"
          description={verifyMutation.error?.message || '이메일 인증에 실패했습니다.'}
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
    </AuthPageLayout>
  );
}

export default function EmailVerifyPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <EmailVerifyContent />
    </Suspense>
  );
}
