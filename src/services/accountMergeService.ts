import { authApi } from '@/lib/httpClient';
import { convertToAuthError } from '@/lib/errorConverter';
import type {
  InitiateAccountMergeDto,
  AccountMergeResponse,
  AccountMergeInitiateResponse,
} from '@/types';

/**
 * 계정 병합 서비스
 * auth-server의 /account-merge API를 호출하여 계정 병합 기능을 처리합니다.
 */
export class AccountMergeService {
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
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
    }
  }

  /**
   * 계정 병합 승인 (User B가 승인)
   * @param requestId - 병합 요청 ID
   * @param accessToken - 인증 토큰
   */
  async confirmAccountMerge(requestId: number, accessToken: string): Promise<void> {
    try {
      await authApi.post(
        `/account-merge/${requestId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      throw convertToAuthError(error);
    }
  }

  /**
   * 계정 병합 거부 (User B가 거부)
   * @param requestId - 병합 요청 ID
   * @param accessToken - 인증 토큰
   */
  async rejectAccountMerge(requestId: number, accessToken: string): Promise<void> {
    try {
      await authApi.post(
        `/account-merge/${requestId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      throw convertToAuthError(error);
    }
  }
}

// 싱글톤 인스턴스
export const accountMergeService = new AccountMergeService();
