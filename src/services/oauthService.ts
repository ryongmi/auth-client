import { authApi } from '@/lib/httpClient';
import { convertToAuthError } from '@/lib/errorConverter';
import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth';

export interface LinkedAccount {
  id: string;
  provider: OAuthAccountProviderType;
  createdAt: Date;
}

export class OAuthService {
  /**
   * 연동된 OAuth 계정 목록 조회
   */
  async getLinkedAccounts(accessToken: string): Promise<LinkedAccount[]> {
    try {
      const response = await authApi.get<LinkedAccount[]>('/oauth/accounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw convertToAuthError(error);
    }
  }

  /**
   * OAuth 계정 연동 URL 생성
   */
  getLinkAccountUrl(provider: typeof OAuthAccountProviderType.GOOGLE | typeof OAuthAccountProviderType.NAVER): string {
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000';
    return `${baseUrl}/oauth/link-${provider}`;
  }

  /**
   * OAuth 계정 연동 해제
   */
  async unlinkAccount(provider: string, accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await authApi.delete<{ success: boolean; message: string }>(
        `/oauth/accounts/${provider}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw convertToAuthError(error);
    }
  }
}

// 싱글톤 인스턴스
export const oauthService = new OAuthService();
