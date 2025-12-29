'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { oauthService, LinkedAccount } from '@/services/oauthService';
import {
  getOAuthErrorMessage,
  isOAuthErrorCode,
  parseOAuthEmailDuplicateError,
  type OAuthProvider,
  type OAuthEmailDuplicateDetails,
} from '@/utils/oauthErrorMapper';
import { OAuthEmailDuplicateError } from '@/components/OAuthEmailDuplicateError';

import type { UserProfile } from '@krgeobuk/user/interfaces';

export default function OAuthAccountsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [_userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [oauthEmailDuplicateDetails, setOauthEmailDuplicateDetails] =
    useState<OAuthEmailDuplicateDetails | null>(null);

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
        text: `${provider === 'google' ? 'Google' : 'Naver'} 계정이 성공적으로 연동되었습니다.`,
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

  const handleLinkAccount = (provider: 'google' | 'naver'): void => {
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

  const getProviderLabel = (provider: string): string => {
    switch (provider) {
      case 'homePage':
        return '홈페이지';
      case 'google':
        return 'Google';
      case 'naver':
        return 'Naver';
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: string): string => {
    switch (provider) {
      case 'homePage':
        return '🏠';
      case 'google':
        return '📧';
      case 'naver':
        return '💚';
      default:
        return '🔐';
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
                {account.provider !== 'homePage' && linkedAccounts.length > 1 && (
                  <button
                    onClick={() => handleUnlinkAccount(account.provider)}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    연동 해제
                  </button>
                )}
                {account.provider === 'homePage' && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    기본 계정
                  </span>
                )}
                {linkedAccounts.length === 1 && account.provider !== 'homePage' && (
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
            {!isLinked('google') && (
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
                  onClick={() => handleLinkAccount('google')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  연동하기
                </button>
              </div>
            )}

            {!isLinked('naver') && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💚</span>
                  <div>
                    <div className="font-medium">Naver</div>
                    <div className="text-sm text-gray-500">Naver 계정으로 로그인할 수 있습니다</div>
                  </div>
                </div>
                <button
                  onClick={() => handleLinkAccount('naver')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  연동하기
                </button>
              </div>
            )}

            {isLinked('google') && isLinked('naver') && (
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
