/**
 * 인증 관련 상수 정의
 * auth-client 전역에서 사용되는 상수들을 중앙 관리
 */

/**
 * 인증 설정 상수
 */
export const AUTH_CONFIG = {
  /** 최대 로그인 시도 횟수 */
  LOGIN_MAX_ATTEMPTS: 5,

  /** SSO 세션 ID 유효성 검사 정규식 */
  SESSION_ID_REGEX: /^[a-zA-Z0-9_-]{20,}$/,

  /** 비밀번호 최소 길이 */
  PASSWORD_MIN_LENGTH: 8,

  /** 비밀번호 최대 길이 */
  PASSWORD_MAX_LENGTH: 20,

  /** 이름 최소 길이 */
  NAME_MIN_LENGTH: 3,

  /** 이메일 최대 길이 */
  EMAIL_MAX_LENGTH: 254,

  /** 일반 입력 최대 길이 */
  INPUT_MAX_LENGTH: 254,
} as const;

/**
 * 의심스러운 입력 패턴 (SQL Injection, XSS 방지)
 */
export const SUSPICIOUS_PATTERNS = [
  /['"]/g, // SQL injection 기본 패턴
  /union\s+select/i, // SQL injection
  /or\s+1\s*=\s*1/i, // SQL injection
  /<script/i, // XSS
  /javascript:/i, // XSS
] as const;

/**
 * 이메일 유효성 검사 정규식 (RFC 5322 기반)
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  // 입력 검증
  INPUT_TOO_LONG: '입력값이 너무 깁니다.',
  INVALID_INPUT_FORMAT: '잘못된 입력 형식입니다.',
  SUSPICIOUS_REQUEST: '비정상적인 요청이 감지되었습니다.',

  // 이메일
  EMAIL_REQUIRED: '이메일을 입력해주세요',
  EMAIL_INVALID: '올바른 이메일 형식을 입력해주세요',
  EMAIL_TOO_LONG: '이메일 주소가 너무 깁니다',

  // 비밀번호
  PASSWORD_REQUIRED: '비밀번호를 입력해주세요',
  PASSWORD_TOO_SHORT: '비밀번호는 최소 8자 이상이어야 합니다',
  PASSWORD_TOO_LONG: '비밀번호가 너무 깁니다',
  PASSWORD_CONFIRM_REQUIRED: '비밀번호 확인을 입력해주세요',
  PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다',

  // 이름
  NAME_REQUIRED: '이름을 입력해주세요',
  NAME_TOO_SHORT: '이름은 최소 3자 이상이어야 합니다',

  // 약관
  TERMS_REQUIRED: '이용약관에 동의해주세요',

  // SSO
  INVALID_SSO_SESSION: '잘못된 SSO 세션입니다.',
} as const;
