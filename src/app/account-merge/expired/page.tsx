'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AccountMergeExpiredPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* 만료 아이콘 */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            병합 요청이 만료되었습니다
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 mb-6">
            병합 요청의 유효 기간(24시간)이 지났습니다.
            <br />
            다시 연동을 시도해주세요.
          </p>

          {/* 안내 박스 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start text-left">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
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
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">만료 안내</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>병합 요청은 24시간 동안 유효합니다</li>
                  <li>계정 설정에서 다시 연동을 시도할 수 있습니다</li>
                  <li>새 요청 시 확인 이메일이 다시 발송됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/settings/accounts')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              계정 설정에서 다시 시도
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
