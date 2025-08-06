// ============================================================================
// 공통패키지 타입
// ============================================================================
import type { ApiResponse, HttpClientConfig } from '@krgeobuk/http-client/types';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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

// 공통패키지 스타일 에러 처리 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 공통패키지와 동일한 에러 형태로 변환
    const errorResponse = {
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || '알 수 없는 오류가 발생했습니다.',
      statusCode: error.response?.status || 500,
      data: error.response?.data?.data || null,
    };
    return Promise.reject(errorResponse);
  }
);

// auth-client 전용 API 클라이언트 (공통패키지 타입 사용)
export const apiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    axiosInstance.get<ApiResponse<T>>(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    axiosInstance.post<ApiResponse<T>>(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    axiosInstance.put<ApiResponse<T>>(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    axiosInstance.delete<ApiResponse<T>>(url, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    axiosInstance.patch<ApiResponse<T>>(url, data, config),
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

export const setCookie = (name: string, value: string, options: {
  expires?: Date;
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}): void => {
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

export const deleteCookie = (name: string, options: {
  domain?: string;
  path?: string;
} = {}): void => {
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
    path: '/' 
  });
  
  // 세션 관련 쿠키 정리
  deleteCookie('session-id', { 
    domain: '.krgeobuk.com',
    path: '/' 
  });
};

// SSO 관련 유틸리티 함수들
export const generateSSOSession = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
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
  console.log('Auth client HTTP cleanup completed');
};

export default apiClient;