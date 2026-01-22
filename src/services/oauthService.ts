import { authApi } from '@/lib/httpClient';
import { AuthError } from '@/types';
import { AxiosError } from 'axios';
import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth';

export interface LinkedAccount {
  id: string;
  provider: string;
  createdAt: string;
}

export class OAuthService {
  // Axios 에러를 AuthError로 변환하는 헬퍼 메서드
  private convertToAuthError(error: unknown): AuthError {
    if (error instanceof AxiosError) {
      const response = error.response;
      const status = response?.status || 0;

      // 서버 응답이 있는 경우
      if (response?.data) {
        return {
          message: response.data.message || error.message || '요청 처리 중 오류가 발생했습니다',
          code: response.data.code || `HTTP_${status}`,
          isRetryable: status >= 500 || status === 408 || status === 429,
        };
      }

      // 네트워크 에러 (서버 응답 없음)
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        return {
          message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
          code: 'NETWORK_ERROR',
          isRetryable: true,
        };
      }

      // 타임아웃
      if (error.code === 'ECONNREFUSED') {
        return {
          message: '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
          code: 'TIMEOUT_ERROR',
          isRetryable: true,
        };
      }
    }

    // 기타 에러
    return {
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      code: 'UNKNOWN_ERROR',
      isRetryable: false,
    };
  }

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
      throw this.convertToAuthError(error);
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
      throw this.convertToAuthError(error);
    }
  }
}

// 싱글톤 인스턴스
export const oauthService = new OAuthService();
