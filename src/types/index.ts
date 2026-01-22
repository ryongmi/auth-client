// ============================================================================
// 공통패키지 타입 정의
// ============================================================================
export type { ApiResponse, ApiError } from '@krgeobuk/http-client/types';
export type { ResponseFormat } from '@krgeobuk/core/interfaces';
export type { LoggedInUser as User } from '@krgeobuk/shared/user';
export type { AuthLoginRequest as LoginRequest } from '@krgeobuk/auth/interfaces';
export type { AuthLoginResponse as LoginResponse } from '@krgeobuk/auth/interfaces';
export type { AuthSignupRequest as SignupRequest } from '@krgeobuk/auth/interfaces';
export type { AuthLoginResponse as SignupResponse } from '@krgeobuk/auth/interfaces';

// 계정 병합 관련 타입 (공통패키지)
export type { InitiateAccountMergeRequest as InitiateAccountMergeDto } from '@krgeobuk/account-merge/interfaces';
export type { InitiateAccountMergeResponse as AccountMergeInitiateResponse } from '@krgeobuk/account-merge/interfaces';
export type { GetAccountMergeResponse as AccountMergeResponse } from '@krgeobuk/account-merge/interfaces';
export { AccountMergeStatus } from '@krgeobuk/shared/account-merge';

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

// auth-client 전용 에러 타입 (공통 ApiError와 호환)
import type { ApiError as BaseApiError } from '@krgeobuk/http-client/types';

export interface AuthError extends BaseApiError {
  isRetryable?: boolean; // 재시도 가능 여부 (auth-client 특화)
  message: string; // message 필드 보장
  code: string; // code 필드 보장
}

// SSO 관련 타입 (필수 유지)
export interface SSOLoginRequest extends AuthLoginRequest {
  sessionId?: string;
  redirectUri?: string;
}

