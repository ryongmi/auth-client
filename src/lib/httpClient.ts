// ============================================================================
// 공통패키지 타입
// ============================================================================
import type { ApiResponse, HttpClientConfig } from '@krgeobuk/http-client/types';

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthError } from '@/types';

// auth-client 전용 HTTP 클라이언트 설정 (토큰 관리 없음)
const authClientConfig: HttpClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true, // HTTP-only 쿠키 지원
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

const axiosInstance: AxiosInstance = axios.create(authClientConfig);

// 향상된 에러 처리 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorResponse;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // 타임아웃 에러
      errorResponse = {
        code: 'TIMEOUT_ERROR',
        message: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        statusCode: 408,
        data: null,
        isRetryable: true,
      };
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      // 네트워크 에러 (서버 연결 불가)
      errorResponse = {
        code: 'NETWORK_ERROR',
        message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
        statusCode: 0,
        data: null,
        isRetryable: true,
      };
    } else {
      // 서버 응답이 있는 경우
      const status = error.response.status;
      const serverData = error.response.data;

      if (status >= 500) {
        // 서버 내부 오류
        errorResponse = {
          code: serverData?.code || 'SERVER_ERROR',
          message: '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          statusCode: status,
          data: serverData?.data || null,
          isRetryable: true,
        };
      } else if (status === 401) {
        // 인증 오류
        errorResponse = {
          code: serverData?.code || 'UNAUTHORIZED',
          message: '로그인이 필요합니다.',
          statusCode: status,
          data: serverData?.data || null,
          isRetryable: false,
        };
      } else if (status === 403) {
        // 권한 오류
        errorResponse = {
          code: serverData?.code || 'FORBIDDEN',
          message: '접근 권한이 없습니다.',
          statusCode: status,
          data: serverData?.data || null,
          isRetryable: false,
        };
      } else if (status === 429) {
        // 요청 한도 초과
        errorResponse = {
          code: serverData?.code || 'TOO_MANY_REQUESTS',
          message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
          statusCode: status,
          data: serverData?.data || null,
          isRetryable: true,
        };
      } else {
        // 기타 클라이언트 오류
        errorResponse = {
          code: serverData?.code || 'CLIENT_ERROR',
          message: serverData?.message || '요청을 처리할 수 없습니다.',
          statusCode: status,
          data: serverData?.data || null,
          isRetryable: false,
        };
      }
    }

    // 개발 환경에서만 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[HTTP Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        code: errorResponse.code,
        message: errorResponse.message,
      });
    }

    return Promise.reject(errorResponse);
  }
);

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1초
  retryableErrors: ['TIMEOUT_ERROR', 'NETWORK_ERROR', 'SERVER_ERROR', 'TOO_MANY_REQUESTS'],
};

// 재시도 로직이 포함된 요청 함수
const requestWithRetry = async <T>(
  requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
  retryCount = 0
): Promise<AxiosResponse<ApiResponse<T>>> => {
  try {
    return await requestFn();
  } catch (error) {
    // 에러 객체의 타입을 명시적으로 캐스팅
    const authError = error as AuthError & { config?: { url?: string } };
    const shouldRetry = 
      retryCount < RETRY_CONFIG.maxRetries && 
      authError.isRetryable && 
      RETRY_CONFIG.retryableErrors.includes(authError.code);

    if (shouldRetry) {
      // 지수 백오프: 재시도할 때마다 지연 시간 증가
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[HTTP Retry] ${retryCount + 1}/${RETRY_CONFIG.maxRetries} - ${delay}ms 후 재시도`, {
          url: authError.config?.url,
          code: authError.code,
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return requestWithRetry(requestFn, retryCount + 1);
    }

    throw error;
  }
};

// auth-client 전용 API 클라이언트 (GET/POST만 사용, 재시도 포함)
export const apiClient = {
  get: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> =>
    requestWithRetry(() => axiosInstance.get<ApiResponse<T>>(url, config)),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> =>
    requestWithRetry(() => axiosInstance.post<ApiResponse<T>>(url, data, config)),
};

// auth-client 전용 쿠키 유틸리티 함수들
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

export const setCookie = (
  name: string,
  value: string,
  options: {
    expires?: Date;
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void => {
  if (typeof document === 'undefined') return;

  let cookieString = `${name}=${value}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

export const deleteCookie = (
  name: string,
  options: {
    domain?: string;
    path?: string;
  } = {}
): void => {
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
};

// auth-client에서는 토큰을 직접 관리하지 않으므로 대부분의 토큰 관리 함수 제거
// 필요시 세션 정리를 위한 최소한의 함수만 유지
export const clearAuthCookies = (): void => {
  // CSRF 토큰 등 기본 쿠키만 정리
  deleteCookie('csrf-token', {
    domain: '.krgeobuk.com',
    path: '/',
  });

  // 세션 관련 쿠키 정리
  deleteCookie('session-id', {
    domain: '.krgeobuk.com',
    path: '/',
  });
};

// SSO 관련 유틸리티 함수들
export const generateSSOSession = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getSSORedirectUrl = (sessionId: string, redirectUri: string): string => {
  const params = new URLSearchParams({
    'redirect-session': sessionId,
    'redirect-uri': redirectUri,
  });

  return `${window.location.origin}/login?${params.toString()}`;
};

// HTTP 클라이언트 정리 함수
export const cleanupHttpClient = (): void => {
  // auth-client에서는 특별한 정리가 필요하지 않음 (토큰 관리 없음)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Auth client HTTP cleanup completed');
  }
};

export default apiClient;
