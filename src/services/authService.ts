import { authApi } from '@/lib/httpClient';
import {
  LoginRequest,
  ExtendedSignupRequest,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  SignupResponse,
  LoginResponse,
  AuthError,
} from '@/types';
import { AxiosError } from 'axios';

import type { UserProfile } from '@krgeobuk/user/interfaces';

export class AuthService {
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
          // statusCode: status,
          isRetryable: status >= 500 || status === 408 || status === 429,
        };
      }

      // 네트워크 에러 (서버 응답 없음)
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        return {
          message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
          code: 'NETWORK_ERROR',
          // statusCode: 0,
          isRetryable: true,
        };
      }

      // 타임아웃
      if (error.code === 'ECONNREFUSED') {
        return {
          message: '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
          code: 'TIMEOUT_ERROR',
          // statusCode: 0,
          isRetryable: true,
        };
      }
    }

    // 기타 에러
    return {
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      code: 'UNKNOWN_ERROR',
      // statusCode: 0,
      isRetryable: false,
    };
  }

  // 로그인 (SSO 지원)
  async login(loginData: LoginRequest, redirectSession?: string): Promise<LoginResponse> {
    try {
      const url = redirectSession
        ? `/auth/login?redirect_session=${redirectSession}`
        : '/auth/login';
      const response = await authApi.post<LoginResponse>(url, loginData);
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  // 회원가입
  async signup(
    signupData: ExtendedSignupRequest,
    redirectSession?: string
  ): Promise<SignupResponse> {
    try {
      // 공통패키지 SignupRequest 형식으로 변환 (UI 전용 필드 제거)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, agreedToTerms, ...apiSignupData } = signupData;

      const url = redirectSession
        ? `/auth/signup?redirect_session=${redirectSession}`
        : '/auth/signup';

      const response = await authApi.post<SignupResponse>(url, apiSignupData);
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  // Google OAuth 로그인 URL 생성
  getGoogleLoginUrl(redirectSession?: string): string {
    const params = new URLSearchParams();
    if (redirectSession) {
      params.set('redirect_session', redirectSession);
    }

    const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000';
    return `${baseUrl}/oauth/login-google?${params.toString()}`;
  }

  // Naver OAuth 로그인 URL 생성
  getNaverLoginUrl(redirectSession?: string): string {
    const params = new URLSearchParams();
    if (redirectSession) {
      params.set('redirect_session', redirectSession);
    }

    const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000';
    return `${baseUrl}/oauth/login-naver?${params.toString()}`;
  }

  // 비밀번호 찾기
  async forgotPassword(data: ForgotPasswordFormData): Promise<{ message: string }> {
    try {
      const response = await authApi.post<{ message: string }>('/auth/forgot-password', data);
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  // 비밀번호 재설정
  async resetPassword(data: ResetPasswordFormData): Promise<{ message: string }> {
    try {
      const response = await authApi.post<{ message: string }>('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  // 이메일 인증 요청
  async requestEmailVerification(email: string): Promise<{ message: string }> {
    try {
      const response = await authApi.post<{ message: string }>('/auth/verify-email/request', {
        email,
      });
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  // 이메일 인증 확인
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await authApi.post<{ message: string }>('/auth/verify-email/confirm', {
        token,
      });
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }

  // 클라이언트 초기화 (RefreshToken으로 AccessToken 및 사용자 정보 반환)
  async initialize(): Promise<{ accessToken: string; user: UserProfile }> {
    try {
      const response = await authApi.post<{ accessToken: string; user: UserProfile }>(
        '/auth/initialize'
      );
      return response.data;
    } catch (error) {
      throw this.convertToAuthError(error);
    }
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();
