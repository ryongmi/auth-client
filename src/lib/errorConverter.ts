import { AxiosError } from 'axios';
import type { AuthError } from '@/types';

/**
 * Axios 에러를 AuthError로 변환하는 유틸리티
 * authService, oauthService, accountMergeService에서 공통으로 사용
 */
export function convertToAuthError(error: unknown): AuthError {
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
