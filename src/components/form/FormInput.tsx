'use client';

import React, { type ChangeEvent, type ReactNode } from 'react';

/**
 * FormInput 컴포넌트 Props
 */
export interface FormInputProps {
  /** 입력 필드 ID 및 name */
  name: string;
  /** 라벨 텍스트 */
  label: string;
  /** 입력 타입 */
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  /** 입력 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 에러 메시지 */
  error?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 왼쪽 아이콘 (ReactNode) */
  icon?: ReactNode;
  /** 추가 라벨 텍스트 (선택사항 표시 등) */
  labelSuffix?: ReactNode;
  /** 자동완성 속성 */
  autoComplete?: string;
}

/**
 * 공통 폼 입력 컴포넌트
 * 아이콘, 라벨, 에러 표시를 포함한 일관된 입력 필드
 */
export function FormInput({
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  icon,
  labelSuffix,
  autoComplete,
}: FormInputProps): React.JSX.Element {
  const hasIcon = Boolean(icon);

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-600 mb-2"
      >
        {label}
        {labelSuffix && (
          <span className="text-gray-400 ml-1">{labelSuffix}</span>
        )}
      </label>
      <div className="relative">
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="h-5 w-5 text-gray-400">{icon}</span>
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full ${hasIcon ? 'pl-10' : 'px-4'} pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <WarningIcon className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 경고 아이콘 컴포넌트
 */
function WarningIcon({ className }: { className?: string }): React.JSX.Element {
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );
}

// 자주 사용되는 아이콘들을 export
export const FormInputIcons = {
  /** 이메일 아이콘 */
  Email: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
      />
    </svg>
  ),
  /** 비밀번호 아이콘 */
  Password: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  /** 사용자 아이콘 */
  User: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  /** 체크 아이콘 (비밀번호 확인용) */
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
