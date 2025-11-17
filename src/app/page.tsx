'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // 홈페이지 접근 시 로그인 페이지로 리다이렉트
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* 로딩 스피너 */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 text-lg">로그인 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
