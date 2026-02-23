/**
 * 폼 입력 유효성 검사 유틸리티
 * auth-client 전역에서 사용되는 유효성 검사 함수들
 */

import { OAuthAccountProviderType } from '@krgeobuk/shared/oauth/enum';
import {
  AUTH_CONFIG,
  SUSPICIOUS_PATTERNS,
  EMAIL_REGEX,
  ERROR_MESSAGES,
} from '@/config/constants';

/**
 * 유효성 검사 결과 타입
 */
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * 의심스러운 입력 패턴 검사 (SQL Injection, XSS 방지)
 * @param value - 검사할 값
 * @returns 의심스러운 패턴이 발견되면 true
 */
export function hasSuspiciousPattern(value: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * 일반 입력 유효성 검사
 * @param value - 검사할 값
 * @param maxLength - 최대 길이 (기본값: AUTH_CONFIG.INPUT_MAX_LENGTH)
 * @returns 유효성 검사 결과
 */
export function validateInput(
  value: string,
  maxLength: number = AUTH_CONFIG.INPUT_MAX_LENGTH
): ValidationResult {
  if (value.length > maxLength) {
    return { isValid: false, error: ERROR_MESSAGES.INPUT_TOO_LONG };
  }

  if (hasSuspiciousPattern(value)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_INPUT_FORMAT };
  }

  return { isValid: true, error: null };
}

/**
 * 이메일 유효성 검사
 * @param email - 검사할 이메일
 * @returns 유효성 검사 결과
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_REQUIRED };
  }

  if (email.length > AUTH_CONFIG.EMAIL_MAX_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_TOO_LONG };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_INVALID };
  }

  return { isValid: true, error: null };
}

/**
 * 비밀번호 유효성 검사
 * @param password - 검사할 비밀번호
 * @returns 유효성 검사 결과
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim() === '') {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_REQUIRED };
  }

  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }

  if (password.length > AUTH_CONFIG.PASSWORD_MAX_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_TOO_LONG };
  }

  return { isValid: true, error: null };
}

/**
 * 비밀번호 확인 유효성 검사
 * @param password - 비밀번호
 * @param confirmPassword - 확인 비밀번호
 * @returns 유효성 검사 결과
 */
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_CONFIRM_REQUIRED };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_MISMATCH };
  }

  return { isValid: true, error: null };
}

/**
 * 이름 유효성 검사
 * @param name - 검사할 이름
 * @returns 유효성 검사 결과
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: ERROR_MESSAGES.NAME_REQUIRED };
  }

  if (name.length < AUTH_CONFIG.NAME_MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.NAME_TOO_SHORT };
  }

  return { isValid: true, error: null };
}

/**
 * SSO 세션 ID 유효성 검사
 * @param sessionId - 검사할 세션 ID
 * @returns 유효성 검사 결과
 */
export function validateSessionId(sessionId: string): ValidationResult {
  if (!AUTH_CONFIG.SESSION_ID_REGEX.test(sessionId)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_SSO_SESSION };
  }

  return { isValid: true, error: null };
}

/**
 * OAuth Provider 유효성 검사
 * @param value - 검사할 값
 * @returns Provider가 유효하면 true
 */
export function isValidProvider(value: unknown): value is OAuthAccountProviderType {
  return Object.values(OAuthAccountProviderType).includes(value as OAuthAccountProviderType);
}

/**
 * 안전한 Provider 값 추출
 * @param value - 검사할 값
 * @returns 유효한 Provider 또는 undefined
 */
export function getValidProvider(value: unknown): OAuthAccountProviderType | undefined {
  if (isValidProvider(value)) {
    return value;
  }
  return undefined;
}
