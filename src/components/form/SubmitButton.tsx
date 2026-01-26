'use client';

import React, { type ReactNode } from 'react';

/**
 * SubmitButton 컴포넌트 Props
 */
export interface SubmitButtonProps {
  /** 버튼 텍스트 */
  children: ReactNode;
  /** 로딩 중 여부 */
  isLoading?: boolean;
  /** 로딩 중 표시 텍스트 */
  loadingText?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 차단 상태 여부 (rate limit 등) */
  isBlocked?: boolean;
  /** 차단 상태 텍스트 */
  blockedText?: string;
  /** 버튼 타입 */
  type?: 'submit' | 'button';
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 버튼 아이콘 (로딩/차단 아닌 경우) */
  icon?: ReactNode;
  /** 전체 너비 여부 */
  fullWidth?: boolean;
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary';
}

/**
 * 폼 제출 버튼 컴포넌트
 * 로딩 상태, 차단 상태, 아이콘을 포함한 일관된 버튼
 */
export function SubmitButton({
  children,
  isLoading = false,
  loadingText = '처리 중...',
  disabled = false,
  isBlocked = false,
  blockedText = '일시적으로 차단됨',
  type = 'submit',
  onClick,
  icon,
  fullWidth = true,
  variant = 'primary',
}: SubmitButtonProps): React.JSX.Element {
  const isDisabled = disabled || isLoading || isBlocked;

  const baseClasses =
    'flex justify-center items-center py-3 px-4 border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

  const variantClasses =
    variant === 'primary'
      ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:ring-blue-500 hover:scale-105 shadow-lg hover:shadow-xl'
      : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses} ${widthClass}`}
    >
      {isBlocked ? (
        <>
          <BlockedIcon className="w-5 h-5 mr-2" />
          {blockedText}
        </>
      ) : isLoading ? (
        <>
          <SpinnerIcon className="w-5 h-5 mr-3" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="w-5 h-5 mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * 스피너 아이콘
 */
function SpinnerIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * 차단 아이콘
 */
function BlockedIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
      />
    </svg>
  );
}

// 자주 사용되는 버튼 아이콘들을 export
export const SubmitButtonIcons = {
  /** 로그인 아이콘 */
  Login: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
      />
    </svg>
  ),
  /** 회원가입 아이콘 */
  Signup: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  ),
  /** 이메일 전송 아이콘 */
  Send: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  /** 체크/확인 아이콘 */
  Check: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};
