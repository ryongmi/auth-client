import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth';

/**
 * OAuth Provider 라벨 매핑
 */
const PROVIDER_LABELS: Record<OAuthAccountProviderType, string> = {
  [OAuthAccountProviderType.HOMEPAGE]: '홈페이지',
  [OAuthAccountProviderType.GOOGLE]: 'Google',
  [OAuthAccountProviderType.NAVER]: 'Naver',
};

/**
 * OAuth Provider 아이콘 매핑
 */
const PROVIDER_ICONS: Record<OAuthAccountProviderType, string> = {
  [OAuthAccountProviderType.HOMEPAGE]: '🏠',
  [OAuthAccountProviderType.GOOGLE]: '📧',
  [OAuthAccountProviderType.NAVER]: '💚',
};

/**
 * Provider 타입에 따른 라벨 반환
 * @param provider - OAuth 제공자 타입
 * @returns 사용자 친화적인 라벨
 */
export function getProviderLabel(provider: string): string {
  const providerType = provider as OAuthAccountProviderType;
  return PROVIDER_LABELS[providerType] ?? provider;
}

/**
 * Provider 타입에 따른 아이콘 반환
 * @param provider - OAuth 제공자 타입
 * @returns 이모지 아이콘
 */
export function getProviderIcon(provider: string): string {
  const providerType = provider as OAuthAccountProviderType;
  return PROVIDER_ICONS[providerType] ?? '🔐';
}
