'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StatusCard, StatusCardIcons } from '@/components/common';

export default function AccountMergeExpiredPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <StatusCard
          type="warning"
          icon={StatusCardIcons.Clock}
          title="병합 요청이 만료되었습니다"
          description={
            <>
              병합 요청의 유효 기간(24시간)이 지났습니다.
              <br />
              다시 연동을 시도해주세요.
            </>
          }
          info={{
            title: '만료 안내',
            items: [
              '병합 요청은 24시간 동안 유효합니다',
              '계정 설정에서 다시 연동을 시도할 수 있습니다',
              '새 요청 시 확인 이메일이 다시 발송됩니다',
            ],
          }}
          actions={[
            {
              label: '계정 설정에서 다시 시도',
              onClick: () => router.push('/settings/accounts'),
            },
            {
              label: '로그인 페이지로 이동',
              variant: 'secondary',
              onClick: () => router.push('/login'),
            },
          ]}
        />
      </div>
    </div>
  );
}
