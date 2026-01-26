'use client';

import React from 'react';
import type { AuthError } from '@/types';

/**
 * FormError 컴포넌트 Props
 */
export interface FormErrorProps {
  /** 에러 메시지 */
  message: string;
  /** 마지막 에러 객체 (재시도 가능 여부 및 에러 코드 확인용) */
  error?: AuthError | null;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 재시도 중 여부 */
  isRetrying?: boolean;
  /** 재시도 횟수 */
  retryCount?: number;
  /** 에러 코드별 추가 안내 표시 여부 */
  showErrorCodeHelp?: boolean;
}

/**
 * 폼 에러 표시 컴포넌트
 * submit 에러 메시지, 재시도 버튼, 에러 코드별 안내를 포함
 */
export function FormError({
  message,
  error,
  onRetry,
  isRetrying = false,
  retryCount = 0,
  showErrorCodeHelp = true,
}: FormErrorProps): React.JSX.Element {
  const isRetryable = error?.isRetryable && onRetry;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <WarningIcon className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800 font-medium">{message}</p>

          {/* 재시도 가능한 에러인 경우 재시도 버튼 표시 */}
          {isRetryable && (
            <div className="mt-3 flex items-center space-x-3">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="text-sm text-red-700 hover:text-red-900 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isRetrying ? (
                  <>
                    <SpinnerIcon className="w-3 h-3 mr-1" />
                    재시도 중...
                  </>
                ) : (
                  <>
                    <RetryIcon className="w-3 h-3 mr-1" />
                    다시 시도
                  </>
                )}
              </button>
              {retryCount > 0 && (
                <span className="text-xs text-red-600">
                  ({retryCount}번째 재시도)
                </span>
              )}
            </div>
          )}

          {/* 에러 코드별 추가 안내 */}
          {showErrorCodeHelp && error?.code === 'NETWORK_ERROR' && (
            <div className="mt-2 text-xs text-red-600">
              • 인터넷 연결을 확인해주세요
              <br />• 방화벽이나 보안 프로그램이 차단하는지 확인해주세요
            </div>
          )}

          {showErrorCodeHelp && error?.code === 'SERVER_ERROR' && (
            <div className="mt-2 text-xs text-red-600">
              • 서버 점검 중일 수 있습니다
              <br />• 잠시 후 다시 시도해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 경고 아이콘
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

/**
 * 스피너 아이콘
 */
function SpinnerIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
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
 * 재시도 아이콘
 */
function RetryIcon({ className }: { className?: string }): React.JSX.Element {
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
