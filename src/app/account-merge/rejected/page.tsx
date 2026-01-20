'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AccountMergeRejectedPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* 거부 아이콘 */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            계정 병합 요청이 거부되었습니다
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 mb-6">
            병합 요청이 거부되었습니다.
            <br />
            양쪽 계정 모두 그대로 유지됩니다.
          </p>

          {/* 안내 박스 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-start text-left">
              <svg
                className="w-5 h-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">안내</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>계정 데이터에는 변경이 없습니다</li>
                  <li>각 계정은 독립적으로 사용 가능합니다</li>
                  <li>필요 시 다시 병합 요청을 할 수 있습니다</li>
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
              계정 설정으로 이동
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
