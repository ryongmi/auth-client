import { authApi } from '@/lib/httpClient';
import { AuthError } from '@/types';
import type {
  InitiateAccountMergeDto,
  AccountMergeResponse,
  AccountMergeInitiateResponse,
  AccountMergeActionResponse,
} from '@/types';
import { AxiosError } from 'axios';

/**
 * 계정 병합 서비스
 * auth-server의 /account-merge API를 호출하여 계정 병합 기능을 처리합니다.
 */
export class AccountMergeService {
  /**
   * Axios 에러를 AuthError로 변환하는 헬퍼 메서드
   */
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
   * 병합 확인 토큰 검증
   * 이메일 링크의 token을 검증하고 requestId를 반환
   * @param token - 병합 확인 토큰 (UUID)
   * @returns requestId
   */
  async verifyToken(token: string): Promise<{ requestId: number }> {
    try {
      const response = await authApi.get<{ requestId: number }>(
        `/api/account-merge/verify-token?token=${encodeURIComponent(token)}`
      );
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  /**
   * 계정 병합 요청 시작
   * User A가 OAuth 로그인 시도 시 이메일이 이미 존재하는 경우 병합 요청 생성
   * @param dto - 병합 요청 데이터 (provider, providerId, email)
   * @param accessToken - 인증 토큰
   * @returns 생성된 병합 요청 ID와 메시지
   */
  async initiateAccountMerge(
    dto: InitiateAccountMergeDto,
    accessToken: string
  ): Promise<AccountMergeInitiateResponse> {
    try {
      const response = await authApi.post<AccountMergeInitiateResponse>(
        '/account-merge/request',
        dto,
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

  /**
   * 계정 병합 요청 조회
   * @param requestId - 병합 요청 ID
   * @param accessToken - 인증 토큰
   * @returns 병합 요청 정보
   */
  async getAccountMerge(requestId: number, accessToken: string): Promise<AccountMergeResponse> {
    try {
      const response = await authApi.get<AccountMergeResponse>(`/account-merge/${requestId}`, {
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
   * 계정 병합 승인 (User B가 승인)
   * @param requestId - 병합 요청 ID
   * @param accessToken - 인증 토큰
   * @returns 처리 결과 메시지
   */
  async confirmAccountMerge(
    requestId: number,
    accessToken: string
  ): Promise<AccountMergeActionResponse> {
    try {
      const response = await authApi.post<AccountMergeActionResponse>(
        `/account-merge/${requestId}/confirm`,
        {},
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

  /**
   * 계정 병합 거부 (User B가 거부)
   * @param requestId - 병합 요청 ID
   * @param accessToken - 인증 토큰
   * @returns 처리 결과 메시지
   */
  async rejectAccountMerge(
    requestId: number,
    accessToken: string
  ): Promise<AccountMergeActionResponse> {
    try {
      const response = await authApi.post<AccountMergeActionResponse>(
        `/account-merge/${requestId}/reject`,
        {},
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
export const accountMergeService = new AccountMergeService();
