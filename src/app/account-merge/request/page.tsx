'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';
import { getProviderLabel } from '@/utils/providerMapper';
import { StatusCard, StatusCardIcons, Alert } from '@/components/common';

function AccountMergeRequestContent(): React.JSX.Element {
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'success' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const provider = searchParams.get('provider') || '';
  const email = searchParams.get('email') || '';
  const providerId = searchParams.get('providerId') || '';

  // 초기화: 인증 정보 확인
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      // 필수 파라미터 확인
      if (!provider || !email) {
        setStatus('error');
        setError('필수 파라미터가 누락되었습니다. (provider, email)');
        return;
      }

      try {
        // 인증 정보 확인
        const initData = await authService.initialize();
        setAccessToken(initData.accessToken);
        setStatus('ready');
      } catch (err) {
        const authError = err as AuthError;

        // 인증 실패 시 로그인 페이지로 리다이렉트
        if (authError.code === 'HTTP_401' || authError.code === 'UNAUTHORIZED') {
          setError('로그인이 필요합니다.');
          setTimeout(() => {
            const params = new URLSearchParams({ provider, email });
            if (providerId) params.append('providerId', providerId);
            router.push(`/login?redirect=/account-merge/request?${params.toString()}`);
          }, 2000);
          setStatus('error');
          return;
        }

        setStatus('error');
        setError(authError.message || '인증 정보를 확인하는데 실패했습니다.');
      }
    };

    void initialize();
  }, [provider, email, providerId, router]);

  // 병합 요청 전송
  const handleSubmit = async (): Promise<void> => {
    if (!accessToken) return;

    setStatus('processing');
    try {
      const result = await accountMergeService.initiateAccountMerge(
        {
          provider,
          providerId: providerId || '', // providerId가 없으면 서버에서 조회
          email,
        },
        accessToken
      );

      setRequestId(result.requestId);
      setStatus('success');
    } catch (err) {
      const authError = err as AuthError;
      setStatus('error');
      setError(authError.message || '계정 병합 요청에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* 로딩 상태 */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">준비 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 처리 중 상태 */}
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">요청 전송 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 준비 완료 상태 - 병합 요청 폼 */}
        {status === 'ready' && (
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
        {status === 'success' && (
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
                  {requestId && (
                    <span className="block text-xs text-blue-600 mt-2">요청 ID: {requestId}</span>
                  )}
                </>
              } />
            </div>
          </StatusCard>
        )}

        {/* 에러 상태 */}
        {status === 'error' && (
          <StatusCard
            type="error"
            icon={StatusCardIcons.Close}
            title="오류 발생"
            description={error || '알 수 없는 오류가 발생했습니다.'}
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
      </div>
    </div>
  );
}

export default function AccountMergeRequestPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AccountMergeRequestContent />
    </Suspense>
  );
}
