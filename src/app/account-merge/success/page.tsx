'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AccountMergeSuccessPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* 성공 아이콘 */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            계정 병합이 완료되었습니다
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 mb-6">
            모든 데이터가 성공적으로 이전되었습니다.
            <br />
            기존 계정으로 로그인해주세요.
          </p>

          {/* 안내 박스 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start text-left">
              <svg
                className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">병합 완료 안내</p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>두 계정의 데이터가 통합되었습니다</li>
                  <li>연동된 OAuth 계정으로 로그인 가능합니다</li>
                  <li>기존 세션은 만료되었습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
