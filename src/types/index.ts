// ============================================================================
// 공통패키지 타입 정의
// ============================================================================
export type { ApiResponse } from '@krgeobuk/http-client/types';
export type { ResponseFormat } from '@krgeobuk/core/interfaces';
export type { LoggedInUser as User } from '@krgeobuk/shared/user';
export type { AuthLoginRequest as LoginRequest } from '@krgeobuk/auth/interfaces';
export type { AuthLoginResponse as LoginResponse } from '@krgeobuk/auth/interfaces';
export type { AuthSignupRequest as SignupRequest } from '@krgeobuk/auth/interfaces';
export type { AuthSignupResponse as SignupResponse } from '@krgeobuk/auth/interfaces';

// ============================================================================
// auth-client 전용 타입 정의
// ============================================================================

// 공통패키지 타입 import
import type { AuthSignupRequest } from '@krgeobuk/auth/interfaces';
import type { AuthLoginRequest } from '@krgeobuk/auth/interfaces';

// auth-client에서만 사용하는 확장된 회원가입 타입
export interface ExtendedSignupRequest extends AuthSignupRequest {
  confirmPassword: string;
  agreedToTerms: boolean;
}

// OAuth 관련 타입
export interface OAuthCallbackParams {
  code: string;
  state: string;
  redirect_uri?: string;
}

export interface OAuthProvider {
  id: string;
  name: string;
  provider: 'google' | 'naver';
  clientId: string;
  redirectUri: string;
}

// 폼 데이터 타입 (auth-client UI 전용)
export type LoginFormData = AuthLoginRequest;
export type RegisterFormData = ExtendedSignupRequest;

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

// 에러 타입 (auth-client UI 전용 - 간단한 형태)
export interface AuthError {
  code: string;
  message: string;
  statusCode?: number;
  data?: unknown;
}

// SSO 관련 타입
export interface SSOSession {
  sessionId: string;
  redirectUri: string;
  state: string;
  expiresAt: number;
}

export interface SSOLoginRequest extends AuthLoginRequest {
  sessionId?: string;
  redirectUri?: string;
}

// 토큰 관련 타입은 auth-client에서 사용하지 않으므로 제거
// JWT 관련 타입이 필요한 경우 @krgeobuk/jwt 패키지에서 import 가능

// 환경 변수 타입
export interface AuthConfig {
  apiUrl: string;
  authServerUrl: string;
  domain: string;
  googleClientId: string;
  naverClientId: string;
  jwtPublicKey: string;
}
