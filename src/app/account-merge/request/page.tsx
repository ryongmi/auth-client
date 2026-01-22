'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';
import { OAuthAccountProviderType } from '@/types';

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

  // Provider 이름
  const getProviderName = (p: string) => {
    switch (p.toLowerCase()) {
      case OAuthAccountProviderType.GOOGLE:
        return 'Google';
      case OAuthAccountProviderType.NAVER:
        return 'Naver';
      default:
        return p;
    }
  };

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
                <span className="font-medium text-gray-800">{getProviderName(provider)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">대상 이메일</span>
                <span className="font-medium text-gray-800">{email}</span>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">병합 요청 안내</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    <li>대상 이메일 계정 소유자에게 확인 이메일이 발송됩니다</li>
                    <li>소유자가 승인하면 두 계정의 데이터가 병합됩니다</li>
                    <li>병합 후 현재 계정은 삭제됩니다</li>
                  </ul>
                </div>
              </div>
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
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">요청 완료!</h2>
            <p className="text-gray-600 mb-4">
              계정 병합 요청이 전송되었습니다.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong>{email}</strong> 계정 소유자에게 확인 이메일이 발송되었습니다.
                소유자가 승인하면 계정이 병합됩니다.
              </p>
              {requestId && (
                <p className="text-xs text-blue-600 mt-2">요청 ID: {requestId}</p>
              )}
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              로그인 페이지로 이동
            </button>
          </div>
        )}

        {/* 에러 상태 */}
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => router.push('/login')}
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                로그인 페이지로 이동
              </button>
            </div>
          </div>
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
