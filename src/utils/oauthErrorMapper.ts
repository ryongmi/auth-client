/**
 * OAuth 에러 코드를 사용자 친화적인 메시지로 매핑하는 유틸리티
 *
 * NOTE: 현재 auth-client 전용으로 구현
 * 다른 클라이언트(portal-client, my-pick-client 등)에서도 사용하게 되면
 * @krgeobuk/oauth/client-utils로 이동하여 공통화할 것을 권장합니다.
 *
 * 서버로부터 받은 에러 코드(예: OAUTH_101)를 사용자가 읽기 쉬운 메시지로 변환합니다.
 */

import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth/enum';

/**
 * OAuth 제공자 타입 (공통패키지 enum 기반)
 */
export type OAuthProvider = (typeof OAuthAccountProviderType)[keyof typeof OAuthAccountProviderType];

/**
 * 로그인 방법 타입 (email 포함)
 */
export type LoginMethod = 'email' | typeof OAuthAccountProviderType.GOOGLE | typeof OAuthAccountProviderType.NAVER;

/**
 * 에러 타입 분류 (UI 스타일링용)
 */
export type OAuthErrorType = 'error' | 'warning' | 'info';

/**
 * OAuth 에러 상세 정보 (OAUTH_205 전용)
 */
export interface OAuthEmailDuplicateDetails {
  email: string;
  attemptedProvider: OAuthProvider;
  availableLoginMethods: LoginMethod[];
  suggestion: string;
}

/**
 * 계정 병합 요청 정보 (OAUTH_202 전용)
 */
export interface OAuthAccountMergeDetails {
  provider: OAuthProvider;
  mergeRequestCreated: boolean;
}

/**
 * 제공자 이름을 한글로 반환
 */
export function getProviderName(provider?: OAuthProvider): string | null {
  switch (provider) {
    case OAuthAccountProviderType.GOOGLE:
      return 'Google';
    case OAuthAccountProviderType.NAVER:
      return 'Naver';
    case OAuthAccountProviderType.HOMEPAGE:
      return '홈페이지';
    default:
      return null;
  }
}

/**
 * 로그인 방법 이름을 한글로 반환
 */
export function getLoginMethodName(method: LoginMethod): string {
  switch (method) {
    case 'email':
      return '이메일/비밀번호';
    case OAuthAccountProviderType.GOOGLE:
      return 'Google';
    case OAuthAccountProviderType.NAVER:
      return 'Naver';
    default:
      return method;
  }
}

/**
 * URL 파라미터에서 OAUTH_205 에러 상세 정보 파싱
 */
export function parseOAuthEmailDuplicateError(searchParams: URLSearchParams): OAuthEmailDuplicateDetails | null {
  const error = searchParams.get('error');
  if (error !== 'OAUTH_205') return null;

  const email = searchParams.get('email');
  const attemptedProvider = searchParams.get('provider') as OAuthProvider;
  const methodsParam = searchParams.get('methods');
  const suggestion = searchParams.get('suggestion');

  if (!email || !attemptedProvider || !methodsParam) return null;

  const availableLoginMethods = methodsParam.split(',') as LoginMethod[];

  return {
    email,
    attemptedProvider,
    availableLoginMethods,
    suggestion: suggestion || '다음 방법으로 로그인 후 설정에서 계정을 연동할 수 있습니다.',
  };
}

/**
 * URL 파라미터에서 OAUTH_202 에러 상세 정보 파싱
 * (다른 사용자가 사용 중인 OAuth 계정 - 계정 병합 요청 자동 생성됨)
 */
export function parseOAuthAccountMergeError(searchParams: URLSearchParams): OAuthAccountMergeDetails | null {
  const error = searchParams.get('error');
  if (error !== 'OAUTH_202') return null;

  const provider = searchParams.get('provider') as OAuthProvider;

  if (!provider) return null;

  return {
    provider,
    mergeRequestCreated: true, // OAUTH_202는 서버에서 자동으로 병합 요청을 생성함
  };
}

/**
 * OAuth 에러 코드를 사용자에게 표시할 메시지로 변환
 * @param errorCode - OAuth 에러 코드 (예: 'OAUTH_101')
 * @param provider - OAuth 제공자 (선택사항, 제공자별 메시지 커스터마이징용)
 * @returns 사용자에게 표시할 에러 메시지
 */
export function getOAuthErrorMessage(errorCode: string, provider?: OAuthProvider): string {
  const providerName = getProviderName(provider);

  switch (errorCode) {
    // 000 ~ 099: 서버 에러 코드
    case 'OAUTH_000':
      return providerName
        ? `${providerName} OAuth 설정이 누락되었습니다. 관리자에게 문의하세요.`
        : 'OAuth 설정이 누락되었습니다.';

    case 'OAUTH_001':
      return providerName
        ? `${providerName} 인증 준비 중 오류가 발생했습니다.`
        : 'OAuth state 값을 생성하는 데 실패했습니다.';

    case 'OAUTH_002':
      return providerName
        ? `${providerName} 사용자 정보를 저장하는 데 실패했습니다.`
        : 'OAuth 사용자 정보를 저장하는 데 실패했습니다.';

    case 'OAUTH_003':
      return providerName
        ? `${providerName} 로그인 처리 중 오류가 발생했습니다.`
        : 'OAuth 로그인 처리 중 오류가 발생했습니다.';

    // 100 ~ 199: 인증 에러 코드
    case 'OAUTH_100':
      return '인증 정보가 누락되었습니다. 다시 시도해주세요.';

    case 'OAUTH_101':
      return '인증 정보가 만료되었습니다. 다시 로그인해주세요.';

    case 'OAUTH_102':
      return '인증 정보가 일치하지 않습니다. 다시 시도해주세요.';

    case 'OAUTH_103':
      return '인증 정보가 존재하지 않거나 만료되었습니다. 다시 시도해주세요.';

    case 'OAUTH_104':
      return providerName
        ? `${providerName}로부터 인증 코드를 받지 못했습니다.`
        : 'OAuth code 값이 존재하지 않습니다.';

    case 'OAUTH_105':
      return providerName
        ? `${providerName} 토큰 교환에 실패했습니다.`
        : 'OAuth 토큰 교환에 실패했습니다.';

    case 'OAUTH_106':
      return providerName
        ? `${providerName}로부터 사용자 정보를 가져오는 데 실패했습니다.`
        : '사용자 프로필 정보를 가져오는 데 실패했습니다.';

    case 'OAUTH_107':
      return '지원하지 않는 OAuth 공급자입니다.';

    case 'OAUTH_108':
      return 'state 데이터가 올바르지 않습니다.';

    case 'OAUTH_109':
      return providerName ? `${providerName} 로그인이 취소되었습니다.` : '로그인이 취소되었습니다.';

    // 200 ~ 299: 계정 연동 관련 에러 코드
    case 'OAUTH_200':
      return '최소 1개의 로그인 방식은 유지되어야 합니다.';

    case 'OAUTH_201':
      return providerName
        ? `${providerName} 계정이 연동되어 있지 않습니다.`
        : '연동되지 않은 계정입니다.';

    case 'OAUTH_202':
      return providerName
        ? `해당 ${providerName} 계정은 이미 다른 사용자에게 연동되어 있습니다.`
        : '이미 다른 계정에 연동된 OAuth 계정입니다.';

    case 'OAUTH_203':
      return providerName
        ? `이미 ${providerName} 계정이 연동되어 있습니다.`
        : '이미 연동된 계정입니다.';

    case 'OAUTH_204':
      return providerName
        ? `해당 이메일은 ${providerName} 계정으로 가입되지 않았습니다. 일반 로그인을 사용하거나, 계정 설정에서 ${providerName} 계정을 연동해주세요.`
        : '해당 이메일로 가입된 계정이 있지만 OAuth 계정이 연동되지 않았습니다.';

    case 'OAUTH_205':
      return providerName
        ? `${providerName} 로그인을 시도한 이메일은 이미 다른 방법으로 가입되어 있습니다. 기존 로그인 방법을 사용해주세요.`
        : '이미 다른 방법으로 가입된 이메일입니다. 기존 로그인 방법을 사용해주세요.';

    // 알 수 없는 에러 코드
    default:
      return '인증 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
}

/**
 * 에러 코드가 OAuth 에러 코드인지 확인
 */
export function isOAuthErrorCode(code: string): boolean {
  return code.startsWith('OAUTH_');
}

/**
 * 에러 코드의 심각도 분류
 */
export function getOAuthErrorType(errorCode: string): OAuthErrorType {
  switch (errorCode) {
    // 사용자 취소는 정보성 메시지
    case 'OAUTH_109':
      return 'info';

    // 만료 관련은 경고
    case 'OAUTH_101':
    case 'OAUTH_103':
      return 'warning';

    // 나머지는 에러
    default:
      return 'error';
  }
}
