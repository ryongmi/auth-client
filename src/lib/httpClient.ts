import { HttpClient } from '@krgeobuk/http-client';
import type { ApiResponse } from '@krgeobuk/http-client/types';
import type { AxiosRequestConfig } from 'axios';

// auth-client 전용 HTTP 클라이언트 설정 (단일 서버 + SSO 특화)
export const httpClient = new HttpClient(
  {
    auth: {
      baseURL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000',
      timeout: 10000,
      withCredentials: true, // HTTP-only 쿠키 지원
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
    // auth-client는 auth 서버만 사용하지만 타입 호환성을 위해 더미 설정 추가
    authz: {
      baseURL: 'http://localhost:8100', // 사용하지 않음
    },
    portal: {
      baseURL: 'http://localhost:8200', // 사용하지 않음
    },
    mypick: {
      baseURL: 'http://localhost:4000', // 사용하지 않음
    },
  },
  // 토큰 갱신 설정 (auth-client는 HTTP-only 쿠키 사용하므로 필요시에만)
  {
    refreshUrl: '/api/auth/refresh',
    refreshBeforeExpiry: 5 * 60 * 1000, // 5분 전 갱신
  },
  // 보안 정책 (auth-client 특화)
  {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'localhost',
      '127.0.0.1',
      'auth.krgeobuk.com',
    ],
    enableCSRF: true,
    enableInputValidation: true,
    enableSecurityLogging: true,
    rateLimitConfig: {
      maxAttempts: 50, // 인증 서비스는 조금 더 엄격하게
      windowMs: 60 * 1000, // 1분
    },
  }
);

// auth-client 전용 API 클라이언트 (auth-server만 사용)
export const authApi = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    httpClient.get<T>('auth', url, config),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => httpClient.post<T>('auth', url, data, config),
};


// SSO 관련 유틸리티 함수들 (auth-client 특화 기능)
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

// 쿠키 유틸리티 함수들 (기존 SSO 기능 유지)
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

// 기본 내보내기 (기존 코드 호환성)
export default authApi;
