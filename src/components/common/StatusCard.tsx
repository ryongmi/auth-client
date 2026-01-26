'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';

/**
 * StatusCard 액션 버튼
 */
export interface StatusCardAction {
  /** 버튼 텍스트 */
  label: string;
  /** 링크 URL (Link 컴포넌트로 렌더링) */
  href?: string;
  /** 클릭 핸들러 (button으로 렌더링) */
  onClick?: () => void;
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary' | 'link';
}

/**
 * StatusCard 안내 박스
 */
export interface StatusCardInfo {
  /** 안내 박스 제목 */
  title: string;
  /** 안내 항목 목록 */
  items: string[];
}

/**
 * StatusCard 상태 타입
 */
export type StatusType = 'success' | 'warning' | 'error' | 'info';

/**
 * StatusCard Props
 */
export interface StatusCardProps {
  /** 상태 타입 (색상 결정) */
  type: StatusType;
  /** 아이콘 (원형 배경 안에 표시) */
  icon: ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description: ReactNode;
  /** 안내 박스 */
  info?: StatusCardInfo;
  /** 액션 버튼들 */
  actions?: StatusCardAction[];
  /** 추가 콘텐츠 (설명과 안내 박스 사이에 표시) */
  children?: ReactNode;
}

/** 타입별 색상 매핑 */
const typeColors: Record<
  StatusType,
  {
    iconBg: string;
    iconText: string;
    infoBg: string;
    infoBorder: string;
    infoIconText: string;
    infoTitleText: string;
    infoListText: string;
  }
> = {
  success: {
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    infoBg: 'bg-green-50',
    infoBorder: 'border-green-200',
    infoIconText: 'text-green-600',
    infoTitleText: 'text-green-800',
    infoListText: 'text-green-700',
  },
  warning: {
    iconBg: 'bg-yellow-100',
    iconText: 'text-yellow-600',
    infoBg: 'bg-yellow-50',
    infoBorder: 'border-yellow-200',
    infoIconText: 'text-yellow-600',
    infoTitleText: 'text-yellow-800',
    infoListText: 'text-yellow-700',
  },
  error: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    infoBg: 'bg-red-50',
    infoBorder: 'border-red-200',
    infoIconText: 'text-red-600',
    infoTitleText: 'text-red-800',
    infoListText: 'text-red-700',
  },
  info: {
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
    infoBg: 'bg-gray-50',
    infoBorder: 'border-gray-200',
    infoIconText: 'text-gray-600',
    infoTitleText: 'text-gray-700',
    infoListText: 'text-gray-600',
  },
};

/** 타입별 안내 박스 아이콘 */
const infoIcons: Record<StatusType, ReactNode> = {
  success: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
  error: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
  info: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

/**
 * 상태 결과 카드 컴포넌트
 * 성공/에러/만료/거부 등 상태 결과를 일관되게 표시
 */
export function StatusCard({
  type,
  icon,
  title,
  description,
  info,
  actions,
  children,
}: StatusCardProps): React.JSX.Element {
  const colors = typeColors[type];

  return (
    <div className="text-center">
      {/* 상태 아이콘 */}
      <div
        className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
      >
        <span className={`w-8 h-8 ${colors.iconText}`}>{icon}</span>
      </div>

      {/* 제목 */}
      <h2 className="text-2xl font-bold text-gray-700 mb-3">{title}</h2>

      {/* 설명 */}
      <div className="text-gray-500 mb-6">{description}</div>

      {/* 추가 콘텐츠 */}
      {children}

      {/* 안내 박스 */}
      {info && (
        <div
          className={`${colors.infoBg} border ${colors.infoBorder} rounded-lg p-4 mb-6`}
        >
          <div className="flex items-start text-left">
            <span
              className={`w-5 h-5 ${colors.infoIconText} mr-2 mt-0.5 flex-shrink-0`}
            >
              {infoIcons[type]}
            </span>
            <div className={`text-sm ${colors.infoTitleText}`}>
              <p className="font-medium mb-1">{info.title}</p>
              <ul
                className={`list-disc list-inside space-y-1 ${colors.infoListText}`}
              >
                {info.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {actions && actions.length > 0 && (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <StatusCardActionButton key={index} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 액션 버튼 렌더링 컴포넌트
 */
function StatusCardActionButton({
  action,
}: {
  action: StatusCardAction;
}): React.JSX.Element {
  const variant = action.variant ?? 'primary';

  const buttonClasses: Record<string, string> = {
    primary:
      'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors',
    secondary:
      'w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors',
    link: 'text-blue-500 hover:text-blue-400 font-medium transition-colors',
  };

  const className = buttonClasses[variant];

  if (action.href) {
    return (
      <Link
        href={action.href}
        className={variant === 'link' ? className : `block text-center ${className}`}
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

/**
 * 자주 사용되는 상태 아이콘
 */
export const StatusCardIcons = {
  /** 체크 아이콘 (성공) */
  Check: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  /** X 아이콘 (실패) */
  Close: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  /** 시계 아이콘 (만료) */
  Clock: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  /** 차단 아이콘 (거부) */
  Blocked: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  ),
  /** 이메일 아이콘 */
  Email: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
};
