'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError, AccountMergeResponse } from '@/types';
import { AccountMergeStatus } from '@/types';

function AccountMergeConfirmContent(): React.JSX.Element {
  const [status, setStatus] = useState<
    'verifying' | 'loading' | 'loaded' | 'processing' | 'error'
  >('verifying');
  const [mergeRequest, setMergeRequest] = useState<AccountMergeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  // 1단계: 토큰 검증
  useEffect(() => {
    const verifyToken = async (): Promise<void> => {
      if (!token) {
        setStatus('error');
        setError('토큰이 제공되지 않았습니다. 이메일 링크를 다시 확인해주세요.');
        return;
      }

      try {
        // 토큰 검증 (인증 불필요)
        const result = await accountMergeService.verifyToken(token);
        setRequestId(result.requestId);
        setStatus('loading');
      } catch (err) {
        const authError = err as AuthError;
        setStatus('error');
        setError(authError.message || '토큰이 유효하지 않거나 만료되었습니다.');
      }
    };

    void verifyToken();
  }, [token]);

  // 2단계: 인증 확인 및 병합 요청 조회
  useEffect(() => {
    if (status !== 'loading' || requestId === null) return;

    const initialize = async (): Promise<void> => {
      try {
        // 인증 정보 확인
        const initData = await authService.initialize();
        setAccessToken(initData.accessToken);

        // 병합 요청 조회
        const request = await accountMergeService.getAccountMerge(requestId, initData.accessToken);

        // 만료 여부 확인 후 만료 페이지로 리다이렉트
        const isRequestExpired = new Date(request.expiresAt) < new Date();
        if (isRequestExpired) {
          router.push('/account-merge/expired');
          return;
        }

        setMergeRequest(request);
        setStatus('loaded');
      } catch (err) {
        const authError = err as AuthError;

        // 인증 실패 시 로그인 페이지로 리다이렉트
        if (authError.code === 'HTTP_401' || authError.code === 'UNAUTHORIZED') {
          setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
          setTimeout(() => {
            router.push(`/login?redirect=/account-merge/confirm?token=${encodeURIComponent(token || '')}`);
          }, 2000);
          setStatus('error');
          return;
        }

        setStatus('error');
        setError(authError.message || '병합 요청을 불러오는데 실패했습니다.');
      }
    };

    void initialize();
  }, [status, requestId, router, token]);

  // 병합 승인
  const handleConfirm = async (): Promise<void> => {
    if (!accessToken || requestId === null) return;

    setStatus('processing');
    try {
      await accountMergeService.confirmAccountMerge(requestId, accessToken);
      // 성공 페이지로 리다이렉트
      router.push('/account-merge/success');
    } catch (err) {
      const authError = err as AuthError;
      setStatus('error');
      setError(authError.message || '계정 병합에 실패했습니다.');
    }
  };

  // 병합 거부
  const handleReject = async (): Promise<void> => {
    if (!accessToken || requestId === null) return;

    setStatus('processing');
    try {
      await accountMergeService.rejectAccountMerge(requestId, accessToken);
      // 거부 페이지로 리다이렉트
      router.push('/account-merge/rejected');
    } catch (err) {
      const authError = err as AuthError;
      setStatus('error');
      setError(authError.message || '요청 거부에 실패했습니다.');
    }
  };

  // 상태별 메시지 및 스타일
  const getStatusDisplay = (mergeStatus: AccountMergeStatus) => {
    switch (mergeStatus) {
      // 대기 중 상태
      case AccountMergeStatus.PENDING_EMAIL_VERIFICATION:
      case AccountMergeStatus.EMAIL_VERIFIED:
        return { text: '대기 중', color: 'bg-yellow-100 text-yellow-800' };

      // 처리 중 상태
      case AccountMergeStatus.IN_PROGRESS:
      case AccountMergeStatus.STEP1_AUTH_BACKUP:
      case AccountMergeStatus.STEP2_AUTHZ_MERGE:
      case AccountMergeStatus.STEP3_MYPICK_MERGE:
      case AccountMergeStatus.STEP4_USER_DELETE:
      case AccountMergeStatus.STEP5_CACHE_INVALIDATE:
        return { text: '처리 중', color: 'bg-blue-100 text-blue-800' };

      // 완료 상태
      case AccountMergeStatus.COMPLETED:
        return { text: '완료됨', color: 'bg-green-100 text-green-800' };

      // 거부/취소 상태
      case AccountMergeStatus.CANCELLED:
        return { text: '거부됨', color: 'bg-red-100 text-red-800' };

      // 실패 상태
      case AccountMergeStatus.FAILED:
      case AccountMergeStatus.COMPENSATING:
      case AccountMergeStatus.COMPENSATED:
        return { text: '실패', color: 'bg-red-100 text-red-800' };

      default:
        return { text: mergeStatus, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Provider 이름
  const getProviderName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return 'Google';
      case 'naver':
        return 'Naver';
      default:
        return provider;
    }
  };

  // 만료 여부 확인
  const isExpired = mergeRequest ? new Date(mergeRequest.expiresAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* 토큰 검증 중 */}
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">토큰 확인 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">요청 정보 확인 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 처리 중 상태 */}
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 병합 요청 정보 표시 */}
        {status === 'loaded' && mergeRequest && (
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
              <p className="text-gray-600">다음 계정을 병합하시겠습니까?</p>
            </div>

            {/* 요청 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">요청자 이메일</span>
                <span className="font-medium text-gray-800">{mergeRequest.sourceEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">대상 이메일</span>
                <span className="font-medium text-gray-800">{mergeRequest.targetEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">OAuth 제공자</span>
                <span className="font-medium text-gray-800">
                  {getProviderName(mergeRequest.provider)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">상태</span>
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusDisplay(mergeRequest.status).color}`}
                >
                  {getStatusDisplay(mergeRequest.status).text}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">만료 시간</span>
                <span
                  className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}
                >
                  {new Date(mergeRequest.expiresAt).toLocaleString('ko-KR')}
                  {isExpired && ' (만료됨)'}
                </span>
              </div>
            </div>

            {/* 경고 메시지 */}
            {mergeRequest.status === AccountMergeStatus.EMAIL_VERIFIED && !isExpired && (
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">주의사항</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>승인 시 두 계정의 데이터가 병합됩니다</li>
                      <li>요청자 계정({mergeRequest.sourceEmail})은 삭제됩니다</li>
                      <li>이 작업은 되돌릴 수 없습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            {mergeRequest.status === AccountMergeStatus.EMAIL_VERIFIED && !isExpired ? (
              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  승인하기
                </button>
                <button
                  onClick={handleReject}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  거부하기
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  {isExpired
                    ? '이 요청은 만료되었습니다.'
                    : `이 요청은 이미 ${getStatusDisplay(mergeRequest.status).text} 상태입니다.`}
                </p>
                <button
                  onClick={() => router.push('/settings/accounts')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  설정으로 돌아가기
                </button>
              </div>
            )}
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

export default function AccountMergeConfirmPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AccountMergeConfirmContent />
    </Suspense>
  );
}
