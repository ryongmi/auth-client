'use client';

import React, { type ReactNode } from 'react';

/**
 * Alert 타입
 */
export type AlertType = 'info' | 'warning' | 'error' | 'success';

/**
 * Alert 컴포넌트 Props
 */
export interface AlertProps {
  /** 알림 타입 (색상 결정) */
  type: AlertType;
  /** 제목 */
  title?: string;
  /** 메시지 (간단한 텍스트 또는 ReactNode) */
  message?: ReactNode;
  /** 항목 리스트 (bullet points) */
  items?: string[];
  /** 커스텀 아이콘 (기본: 타입별 자동 아이콘) */
  icon?: ReactNode | null;
  /** 중앙 정렬 (SSO 알림 등) */
  centered?: boolean;
  /** 커스텀 콘텐츠 (message, items 대신 사용) */
  children?: ReactNode;
}

/** 타입별 색상 매핑 */
const typeColors: Record<
  AlertType,
  {
    bg: string;
    border: string;
    iconText: string;
    titleText: string;
    bodyText: string;
    listText: string;
  }
> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconText: 'text-blue-600',
    titleText: 'text-blue-800',
    bodyText: 'text-blue-800',
    listText: 'text-blue-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconText: 'text-yellow-600',
    titleText: 'text-yellow-800',
    bodyText: 'text-yellow-800',
    listText: 'text-yellow-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconText: 'text-red-600',
    titleText: 'text-red-800',
    bodyText: 'text-red-600',
    listText: 'text-red-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconText: 'text-green-600',
    titleText: 'text-green-800',
    bodyText: 'text-green-800',
    listText: 'text-green-700',
  },
};

/** 타입별 기본 아이콘 */
const defaultIcons: Record<AlertType, ReactNode> = {
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
};

/**
 * 공통 알림/안내 박스 컴포넌트
 * info, warning, error, success 타입을 지원하며 제목, 메시지, 항목 리스트 표시
 */
export function Alert({
  type,
  title,
  message,
  items,
  icon,
  centered = false,
  children,
}: AlertProps): React.JSX.Element {
  const colors = typeColors[type];
  const resolvedIcon = icon === null ? null : (icon ?? defaultIcons[type]);

  // 중앙 정렬 레이아웃
  if (centered) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        <div className="flex items-center justify-center">
          {resolvedIcon && (
            <span className={`w-5 h-5 ${colors.iconText} mr-3 flex-shrink-0`}>
              {resolvedIcon}
            </span>
          )}
          <p className={`text-sm ${colors.bodyText} font-medium`}>
            {message || children}
          </p>
        </div>
      </div>
    );
  }

  // 아이콘 없는 단순 레이아웃
  if (!resolvedIcon) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        {title && (
          <p className={`text-sm ${colors.titleText} font-medium mb-2`}>
            {title}
          </p>
        )}
        {message && (
          <div className={`text-sm ${colors.bodyText}`}>{message}</div>
        )}
        {items && (
          <ul className={`text-sm ${colors.listText} space-y-1`}>
            {items.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    );
  }

  // 아이콘 + 콘텐츠 레이아웃 (기본)
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-start">
        <span
          className={`w-5 h-5 ${colors.iconText} mr-2 mt-0.5 flex-shrink-0`}
        >
          {resolvedIcon}
        </span>
        <div className="flex-1">
          {title && (
            <p className={`text-sm ${colors.titleText} font-medium mb-1`}>
              {title}
            </p>
          )}
          {message && (
            <div className={`text-sm ${colors.bodyText}`}>{message}</div>
          )}
          {items && (
            <ul
              className={`text-sm ${colors.listText} space-y-1 list-disc list-inside`}
            >
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
