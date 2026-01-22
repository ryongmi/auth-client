'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import type { UserProfile } from '@krgeobuk/user/interfaces';

import { authService } from '@/services/authService';
import { oauthService, LinkedAccount } from '@/services/oauthService';
import {
  getOAuthErrorMessage,
  isOAuthErrorCode,
  parseOAuthEmailDuplicateError,
  type OAuthProvider,
  type OAuthEmailDuplicateDetails,
} from '@/utils/oauthErrorMapper';
import { getProviderLabel, getProviderIcon } from '@/utils/providerMapper';
import { OAuthEmailDuplicateError } from '@/components/OAuthEmailDuplicateError';
import { OAuthAccountProviderType } from '@/types';

function OAuthAccountsContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [_userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [oauthEmailDuplicateDetails, setOauthEmailDuplicateDetails] =
    useState<OAuthEmailDuplicateDetails | null>(null);
  const [mergeRequestSent, setMergeRequestSent] = useState<{ provider: string } | null>(null);

  // 연동 완료 메시지 및 OAuth 에러 처리
  useEffect(() => {
    const linked = searchParams.get('linked');
    const provider = searchParams.get('provider');
    const oauthError = searchParams.get('error');

    // OAuth 에러 처리
    if (oauthError && isOAuthErrorCode(oauthError)) {
      // OAUTH_205 (이메일 중복) 에러는 상세 UI 표시
      if (oauthError === 'OAUTH_205') {
        const details = parseOAuthEmailDuplicateError(searchParams);
        if (details) {
          setOauthEmailDuplicateDetails(details);
        } else {
          // 파싱 실패 시 기본 메시지 표시
          const providerType = provider as OAuthProvider | undefined;
          setMessage({
            type: 'error',
            text: getOAuthErrorMessage(oauthError, providerType),
          });
        }
      } else if (oauthError === 'OAUTH_202') {
        // OAUTH_202 (다른 사용자가 사용 중) - 계정 병합 요청 발송됨
        const providerType = provider as OAuthProvider | undefined;
        setMergeRequestSent({ provider: providerType || 'unknown' });
      } else {
        // 다른 OAuth 에러는 기본 메시지만 표시
        const providerType = provider as OAuthProvider | undefined;
        const errorMessage = getOAuthErrorMessage(oauthError, providerType);
        setMessage({
          type: 'error',
          text: errorMessage,
        });
      }

      // URL 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('provider');
      newUrl.searchParams.delete('email');
      newUrl.searchParams.delete('methods');
      newUrl.searchParams.delete('suggestion');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }

    // 연동 성공 메시지
    if (linked === 'true' && provider && accessToken) {
      setMessage({
        type: 'success',
        text: `${provider === OAuthAccountProviderType.GOOGLE ? 'Google' : 'Naver'} 계정이 성공적으로 연동되었습니다.`,
      });

      // URL 파라미터 제거
      router.replace('/settings/accounts');

      // 계정 목록 새로고침
      fetchLinkedAccounts(accessToken);
    }
  }, [searchParams, accessToken]);

  // 초기화: accessToken 및 사용자 정보 가져오기
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      // 1. authService를 통해 initialize API 호출
      const initData = await authService.initialize();
      setAccessToken(initData.accessToken);
      setUserInfo(initData.user);

      // 2. oauthService를 통해 연동된 계정 목록 조회
      await fetchLinkedAccounts(initData.accessToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '오류가 발생했습니다.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      setLoading(false);
    }
  };

  const fetchLinkedAccounts = async (token: string): Promise<void> => {
    try {
      // oauthService를 통해 연동된 계정 목록 조회
      const data = await oauthService.getLinkedAccounts(token);
      setLinkedAccounts(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '오류가 발생했습니다.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = (
    provider: typeof OAuthAccountProviderType.GOOGLE | typeof OAuthAccountProviderType.NAVER
  ): void => {
    // oauthService를 통해 연동 URL 생성
    const linkUrl = oauthService.getLinkAccountUrl(provider);
    window.location.href = linkUrl;
  };

  const handleUnlinkAccount = async (provider: string): Promise<void> => {
    if (!accessToken) {
      setMessage({
        type: 'error',
        text: '인증 정보가 없습니다. 페이지를 새로고침해주세요.',
      });
      return;
    }

    if (!confirm(`${provider} 계정 연동을 해제하시겠습니까?`)) {
      return;
    }

    try {
      // oauthService를 통해 연동 해제
      const result = await oauthService.unlinkAccount(provider, accessToken);

      setMessage({
        type: 'success',
        text: result.message || `${provider} 계정 연동이 해제되었습니다.`,
      });

      // 계정 목록 새로고침
      fetchLinkedAccounts(accessToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '오류가 발생했습니다.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    }
  };

  const isLinked = (provider: string): boolean => {
    return linkedAccounts.some((account) => account.provider === provider);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">OAuth 계정 관리</h1>
        <p className="text-gray-600 mb-8">
          연동된 계정을 관리하고 새로운 로그인 방식을 추가할 수 있습니다.
        </p>

        {/* OAuth 이메일 중복 에러 상세 UI */}
        {oauthEmailDuplicateDetails && (
          <div className="mb-6">
            <OAuthEmailDuplicateError
              details={oauthEmailDuplicateDetails}
              onLoginClick={() => {
                setOauthEmailDuplicateDetails(null);
                router.push('/login');
              }}
              onRetryClick={() => {
                setOauthEmailDuplicateDetails(null);
                // 계정 설정 페이지에 머무름
              }}
            />
          </div>
        )}

        {/* 계정 병합 요청 발송 알림 (OAUTH_202) */}
        {mergeRequestSent && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
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
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">
                  계정 병합 요청이 발송되었습니다
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  해당{' '}
                  {mergeRequestSent.provider === OAuthAccountProviderType.GOOGLE
                    ? 'Google'
                    : mergeRequestSent.provider === OAuthAccountProviderType.NAVER
                      ? 'Naver'
                      : mergeRequestSent.provider}{' '}
                  계정은 다른 사용자에게 연결되어 있습니다.
                </p>
                <p className="text-sm text-blue-600">
                  계정 소유자에게 병합 확인 이메일이 발송되었습니다. 소유자가 승인하면 계정이
                  병합됩니다.
                </p>
                <button
                  onClick={() => setMergeRequestSent(null)}
                  className="mt-3 text-sm text-blue-700 hover:text-blue-900 font-medium"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일반 메시지 표시 */}
        {!oauthEmailDuplicateDetails && message && (
          <div
            className={`p-4 mb-6 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">연동된 계정</h2>
          <div className="space-y-3">
            {linkedAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getProviderIcon(account.provider)}</span>
                  <div>
                    <div className="font-medium">{getProviderLabel(account.provider)}</div>
                    <div className="text-sm text-gray-500">
                      연동일: {new Date(account.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
                {account.provider !== OAuthAccountProviderType.HOMEPAGE &&
                  linkedAccounts.length > 1 && (
                    <button
                      onClick={() => handleUnlinkAccount(account.provider)}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      연동 해제
                    </button>
                  )}
                {account.provider === OAuthAccountProviderType.HOMEPAGE && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    기본 계정
                  </span>
                )}
                {linkedAccounts.length === 1 &&
                  account.provider !== OAuthAccountProviderType.HOMEPAGE && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      해제 불가
                    </span>
                  )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">연동 가능한 계정</h2>
          <div className="space-y-3">
            {!isLinked(OAuthAccountProviderType.GOOGLE) && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <div className="font-medium">Google</div>
                    <div className="text-sm text-gray-500">
                      Google 계정으로 로그인할 수 있습니다
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleLinkAccount(OAuthAccountProviderType.GOOGLE)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  연동하기
                </button>
              </div>
            )}

            {!isLinked(OAuthAccountProviderType.NAVER) && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💚</span>
                  <div>
                    <div className="font-medium">Naver</div>
                    <div className="text-sm text-gray-500">Naver 계정으로 로그인할 수 있습니다</div>
                  </div>
                </div>
                <button
                  onClick={() => handleLinkAccount(OAuthAccountProviderType.NAVER)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  연동하기
                </button>
              </div>
            )}

            {isLinked(OAuthAccountProviderType.GOOGLE) &&
              isLinked(OAuthAccountProviderType.NAVER) && (
                <div className="text-center text-gray-500 py-8">
                  모든 OAuth 계정이 연동되었습니다.
                </div>
              )}
          </div>
        </section>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← 설정으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthAccountsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <OAuthAccountsContent />
    </Suspense>
  );
}
