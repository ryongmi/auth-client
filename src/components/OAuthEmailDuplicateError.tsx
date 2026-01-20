/**
 * OAuth 이메일 중복 에러 표시 컴포넌트
 * OAUTH_205 에러 발생 시 사용 가능한 로그인 방법을 안내합니다.
 */

import React from 'react';
import {
  type OAuthEmailDuplicateDetails,
  getLoginMethodName,
} from '@/utils/oauthErrorMapper';

interface OAuthEmailDuplicateErrorProps {
  details: OAuthEmailDuplicateDetails;
  onLoginClick?: () => void;
  onRetryClick?: () => void;
  onMergeClick?: () => void;
}

export function OAuthEmailDuplicateError({
  details,
  onLoginClick,
  onRetryClick,
  onMergeClick,
}: OAuthEmailDuplicateErrorProps): React.JSX.Element {
  const { email, availableLoginMethods, suggestion } = details;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
      {/* 제목 */}
      <div className="flex items-start mb-4">
        <svg
          className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">
            이미 가입된 이메일입니다
          </h3>
          <p className="text-sm text-red-700">
            <span className="font-medium">{email}</span>은(는) 이미 사용 중입니다.
          </p>
        </div>
      </div>

      {/* 사용 가능한 로그인 방법 안내 */}
      <div className="bg-white rounded-md p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <svg
            className="w-4 h-4 mr-1.5 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          다음 방법으로 로그인하세요:
        </p>
        <ul className="space-y-2">
          {availableLoginMethods.map((method) => (
            <li key={method} className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{getLoginMethodName(method)}</span> 로그인
            </li>
          ))}
        </ul>
        {suggestion && (
          <p className="text-xs text-gray-500 mt-3 pl-6">
            {suggestion}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2">
        {onMergeClick && (
          <button
            type="button"
            onClick={onMergeClick}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            계정 병합하기
          </button>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          {onLoginClick && (
            <button
              type="button"
              onClick={onLoginClick}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
            >
              로그인하기
            </button>
          )}
          {onRetryClick && (
            <button
              type="button"
              onClick={onRetryClick}
              className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              다른 이메일로 가입
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
