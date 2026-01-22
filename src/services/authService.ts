import { authApi } from '@/lib/httpClient';
import { convertToAuthError } from '@/lib/errorConverter';
import {
  LoginRequest,
  ExtendedSignupRequest,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  SignupResponse,
  LoginResponse,
} from '@/types';

import type { UserProfile } from '@krgeobuk/user/interfaces';

export class AuthService {
  // 로그인 (SSO 지원)
  async login(loginData: LoginRequest, redirectSession?: string): Promise<LoginResponse> {
    try {
      const url = redirectSession
        ? `/auth/login?redirect_session=${redirectSession}`
        : '/auth/login';
      const response = await authApi.post<LoginResponse>(url, loginData);
      return response.data;
    } catch (error) {
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
    }
  }

  // 비밀번호 재설정
  async resetPassword(data: ResetPasswordFormData): Promise<{ message: string }> {
    try {
      const response = await authApi.post<{ message: string }>('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
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
      throw convertToAuthError(error);
    }
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();
