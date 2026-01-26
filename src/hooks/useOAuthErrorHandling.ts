'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getOAuthErrorMessage,
  isOAuthErrorCode,
  parseOAuthEmailDuplicateError,
  type OAuthProvider,
  type OAuthEmailDuplicateDetails,
} from '@/utils/oauthErrorMapper';

/**
 * OAuth 에러 처리 결과 타입
 */
export interface OAuthErrorHandlingResult {
  /** OAUTH_205 이메일 중복 에러 상세 정보 */
  oauthEmailDuplicateDetails: OAuthEmailDuplicateDetails | null;
  /** OAUTH_202 계정 병합 요청 발송 정보 */
  mergeRequestSent: { provider: string } | null;
  /** 일반 에러 메시지 */
  errorMessage: string | null;
  /** 이메일 중복 상세 정보 초기화 */
  clearEmailDuplicateDetails: () => void;
  /** 병합 요청 정보 초기화 */
  clearMergeRequestSent: () => void;
  /** 에러 메시지 초기화 */
  clearErrorMessage: () => void;
}

/**
 * URL에서 OAuth 관련 파라미터 제거
 */
function cleanOAuthParams(): void {
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete('error');
  newUrl.searchParams.delete('provider');
  newUrl.searchParams.delete('email');
  newUrl.searchParams.delete('methods');
  newUrl.searchParams.delete('suggestion');
  window.history.replaceState({}, '', newUrl.toString());
}

/**
 * OAuth 에러 처리 훅
 * URL 파라미터에서 OAuth 에러를 파싱하고 적절한 상태로 변환
 *
 * @returns OAuth 에러 처리 결과
 */
export function useOAuthErrorHandling(): OAuthErrorHandlingResult {
  const searchParams = useSearchParams();

  const [oauthEmailDuplicateDetails, setOauthEmailDuplicateDetails] =
    useState<OAuthEmailDuplicateDetails | null>(null);
  const [mergeRequestSent, setMergeRequestSent] = useState<{ provider: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OAuth 에러 처리
  useEffect(() => {
    const oauthError = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (!oauthError || !isOAuthErrorCode(oauthError)) {
      return;
    }

    const providerType = provider as OAuthProvider | undefined;

    switch (oauthError) {
      case 'OAUTH_205': {
        // 이메일 중복 에러 - 상세 UI 표시
        const details = parseOAuthEmailDuplicateError(searchParams);
        if (details) {
          setOauthEmailDuplicateDetails(details);
        } else {
          // 파싱 실패 시 기본 메시지
          setErrorMessage(getOAuthErrorMessage(oauthError, providerType));
        }
        break;
      }
      case 'OAUTH_202': {
        // 다른 사용자가 사용 중 - 계정 병합 요청 발송됨
        setMergeRequestSent({ provider: providerType || 'unknown' });
        break;
      }
      default: {
        // 기타 OAuth 에러
        setErrorMessage(getOAuthErrorMessage(oauthError, providerType));
        break;
      }
    }

    // URL 파라미터 정리
    cleanOAuthParams();
  }, [searchParams]);

  const clearEmailDuplicateDetails = useCallback(() => {
    setOauthEmailDuplicateDetails(null);
  }, []);

  const clearMergeRequestSent = useCallback(() => {
    setMergeRequestSent(null);
  }, []);

  const clearErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    oauthEmailDuplicateDetails,
    mergeRequestSent,
    errorMessage,
    clearEmailDuplicateDetails,
    clearMergeRequestSent,
    clearErrorMessage,
  };
}
