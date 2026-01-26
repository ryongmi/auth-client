'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StatusCard, StatusCardIcons } from '@/components/common';

export default function AccountMergeSuccessPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <StatusCard
          type="success"
          icon={StatusCardIcons.Check}
          title="계정 병합이 완료되었습니다"
          description={
            <>
              모든 데이터가 성공적으로 이전되었습니다.
              <br />
              기존 계정으로 로그인해주세요.
            </>
          }
          info={{
            title: '병합 완료 안내',
            items: [
              '두 계정의 데이터가 통합되었습니다',
              '연동된 OAuth 계정으로 로그인 가능합니다',
              '기존 세션은 만료되었습니다',
            ],
          }}
          actions={[
            {
              label: '로그인 페이지로 이동',
              onClick: () => router.push('/login'),
            },
          ]}
        />
      </div>
    </div>
  );
}
