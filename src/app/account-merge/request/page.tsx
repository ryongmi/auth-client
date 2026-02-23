'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthInitialize } from '@/hooks/queries/useAuthInitialize';
import { useInitiateMerge } from '@/hooks/mutations/useInitiateMerge';
import { getProviderLabel } from '@/utils/providerMapper';
import { StatusCard, StatusCardIcons, Alert, AuthPageLayout, AuthPageFallback, LoadingSpinner } from '@/components/common';

function AccountMergeRequestContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const provider = searchParams.get('provider') || '';
  const email = searchParams.get('email') || '';
  const providerId = searchParams.get('providerId') || '';
  const hasRequiredParams = !!provider && !!email;

  const [paramError] = useState<string | null>(
    hasRequiredParams ? null : '필수 파라미터가 누락되었습니다. (provider, email)'
  );

  const authQuery = useAuthInitialize({ enabled: hasRequiredParams });
  const mergeMutation = useInitiateMerge();

  // 인증 실패 시 로그인 페이지로 리다이렉트
  if (authQuery.isError && authQuery.error?.code === 'HTTP_401') {
    const params = new URLSearchParams({ provider, email });
    if (providerId) params.append('providerId', providerId);
    setTimeout(() => {
      router.push(`/login?redirect=/account-merge/request?${params.toString()}`);
    }, 2000);
  }

  const handleSubmit = (): void => {
    if (!authQuery.data?.accessToken) return;

    mergeMutation.mutate({
      dto: {
        provider,
        providerId: providerId || '',
        email,
      },
      accessToken: authQuery.data.accessToken,
    });
  };

  const isLoading = authQuery.isLoading;
  const isProcessing = mergeMutation.isPending;
  const isReady = authQuery.isSuccess && !mergeMutation.isSuccess && !mergeMutation.isError;
  const isError = paramError || authQuery.isError || mergeMutation.isError;
  const errorMessage = paramError
    || authQuery.error?.message
    || mergeMutation.error?.message
    || '알 수 없는 오류가 발생했습니다.';

  return (
    <AuthPageLayout>
        {/* 로딩 상태 */}
        {isLoading && <LoadingSpinner title="준비 중..." />}

        {/* 처리 중 상태 */}
        {isProcessing && <LoadingSpinner title="요청 전송 중..." />}

        {/* 준비 완료 상태 - 병합 요청 폼 */}
        {isReady && (
          <div>
            <div className="text-center mb-6">
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">계정 병합 요청</h2>
              <p className="text-gray-600">기존 계정과 새 OAuth 계정을 병합합니다.</p>
            </div>

            {/* 요청 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">OAuth 제공자</span>
                <span className="font-medium text-gray-800">{getProviderLabel(provider)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">대상 이메일</span>
                <span className="font-medium text-gray-800">{email}</span>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mb-6">
              <Alert
                type="warning"
                title="병합 요청 안내"
                items={[
                  '대상 이메일 계정 소유자에게 확인 이메일이 발송됩니다',
                  '소유자가 승인하면 두 계정의 데이터가 병합됩니다',
                  '병합 후 현재 계정은 삭제됩니다',
                ]}
              />
            </div>

            {/* 버튼 */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                병합 요청 보내기
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 성공 상태 */}
        {mergeMutation.isSuccess && (
          <StatusCard
            type="success"
            icon={StatusCardIcons.Check}
            title="요청 완료!"
            description="계정 병합 요청이 전송되었습니다."
            actions={[
              {
                label: '로그인 페이지로 이동',
                onClick: () => router.push('/login'),
              },
            ]}
          >
            <div className="mb-6 text-left">
              <Alert type="info" message={
                <>
                  <strong>{email}</strong> 계정 소유자에게 확인 이메일이 발송되었습니다.
                  소유자가 승인하면 계정이 병합됩니다.
                  {mergeMutation.data?.requestId && (
                    <span className="block text-xs text-blue-600 mt-2">요청 ID: {mergeMutation.data.requestId}</span>
                  )}
                </>
              } />
            </div>
          </StatusCard>
        )}

        {/* 에러 상태 */}
        {isError && !isLoading && !isProcessing && !isReady && !mergeMutation.isSuccess && (
          <StatusCard
            type="error"
            icon={StatusCardIcons.Close}
            title="오류 발생"
            description={errorMessage}
            actions={[
              {
                label: '다시 시도',
                onClick: () => window.location.reload(),
              },
              {
                label: '로그인 페이지로 이동',
                variant: 'secondary',
                onClick: () => router.push('/login'),
              },
            ]}
          />
        )}
    </AuthPageLayout>
  );
}

export default function AccountMergeRequestPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AccountMergeRequestContent />
    </Suspense>
  );
}
