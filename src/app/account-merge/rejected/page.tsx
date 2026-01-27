'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StatusCard, StatusCardIcons, AuthPageLayout } from '@/components/common';

export default function AccountMergeRejectedPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <AuthPageLayout>
      <StatusCard
          type="info"
          icon={StatusCardIcons.Blocked}
          title="계정 병합 요청이 거부되었습니다"
          description={
            <>
              병합 요청이 거부되었습니다.
              <br />
              양쪽 계정 모두 그대로 유지됩니다.
            </>
          }
          info={{
            title: '안내',
            items: [
              '계정 데이터에는 변경이 없습니다',
              '각 계정은 독립적으로 사용 가능합니다',
              '필요 시 다시 병합 요청을 할 수 있습니다',
            ],
          }}
          actions={[
            {
              label: '계정 설정으로 이동',
              onClick: () => router.push('/settings/accounts'),
            },
            {
              label: '홈으로 이동',
              variant: 'secondary',
              onClick: () => router.push('/'),
            },
          ]}
        />
    </AuthPageLayout>
  );
}
