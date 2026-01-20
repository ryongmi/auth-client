# 계정 연동 및 병합 구현 가이드

이 문서는 auth-server의 계정 연동 및 병합 기능을 auth-client에서 구현하기 위한 가이드입니다.

## 용어 정의

| 용어 | 설명 |
|------|------|
| **User A (target)** | 유지할 계정, 기존 이메일/OAuth 소유자 |
| **User B (source)** | 삭제될 계정, 새 OAuth로 연동 시도한 사용자 |

---

## 시나리오 및 프로세스

### 시나리오 1: OAuth 계정 연동 (정상)

**조건**: 로그인된 사용자가 새로운 OAuth provider 연결 시도, 해당 OAuth가 아무에게도 연결되지 않음

```
User A (로그인 상태) → OAuth 연동 요청 (Google/Naver) → 연동 성공
```

**API**: `POST /api/oauth/link-{provider}`

**결과**: OAuth 계정이 User A에게 연동됨

**클라이언트 처리**:
- 성공 시 "연동이 완료되었습니다." 알림
- 연동된 계정 목록 갱신

---

### 시나리오 2: OAuth 계정 연동 → 계정 병합 트리거

**조건**: 로그인된 사용자(User A)가 OAuth 연동 시도했으나, 해당 OAuth가 **다른 사용자(User B)**에게 이미 연결됨

```
User A (로그인) → OAuth 연동 요청 → OAuth가 User B에게 이미 연결됨
                                    ↓
                           계정 병합 요청 자동 생성
                                    ↓
                           User B에게 확인 이메일 발송
                                    ↓
                           409 Conflict 응답 반환
```

**API 응답**: `409 Conflict` with `OAUTH_ALREADY_LINKED_TO_ANOTHER_ACCOUNT`

**클라이언트 처리**:
```typescript
try {
  await linkOAuthAccount(provider);
} catch (error) {
  if (error.code === 'OAUTH_ALREADY_LINKED_TO_ANOTHER_ACCOUNT') {
    // 병합 요청이 자동 생성됨
    showNotification({
      type: 'info',
      message: '해당 OAuth 계정은 다른 사용자에게 연결되어 있습니다.',
      description: '계정 병합 요청이 생성되었습니다. 해당 계정의 이메일을 확인해주세요.',
    });
  }
}
```

---

### 시나리오 3: 계정 병합 확인 (User B 승인)

**조건**: User B가 이메일의 확인 링크 클릭 후 병합 승인

```
User B → 이메일 확인 링크 클릭 → auth-client 병합 확인 페이지
        (/oauth/merge/confirm?token=xxx)
                                    ↓
                              로그인 필요 (User B로)
                                    ↓
                              병합 정보 확인 페이지
                                    ↓
                              "승인" 클릭
                                    ↓
                              POST /api/account-merge/:requestId/confirm
                                    ↓
                              Saga 실행 (데이터 이전)
                                    ↓
                              병합 완료, User B 계정 삭제
```

**Saga 실행 단계**:
1. **STEP1_AUTH_BACKUP**: User B의 OAuth 계정을 User A로 이전
2. **STEP2_AUTHZ_MERGE**: User B의 역할을 User A로 이전
3. **STEP3_MYPICK_MERGE**: User B의 my-pick 데이터 이전
4. **STEP4_USER_DELETE**: User B 계정 soft delete
5. **STEP5_CACHE_INVALIDATE**: 캐시 무효화

**결과**:
- User B의 모든 데이터가 User A로 이전
- User B 계정 삭제 (soft delete)
- User A는 기존 + User B의 OAuth 계정 모두 사용 가능

---

### 시나리오 4: 계정 병합 거부 (User B 거부)

**조건**: User B가 병합 거부

```
User B → 이메일 확인 링크 클릭 → auth-client 병합 확인 페이지
                                    ↓
                              "거부" 클릭
                                    ↓
                              POST /api/account-merge/:requestId/reject
                                    ↓
                              상태 CANCELLED로 변경
```

**결과**: 병합 요청 취소, 양쪽 계정 그대로 유지

---

### 시나리오 5: 병합 요청 만료

**조건**: 24시간 이내 User B가 응답하지 않음

```
병합 요청 생성 → 24시간 경과 → User B가 확인 시도
                                    ↓
                              토큰 만료 에러 발생
                                    ↓
                              상태 CANCELLED로 변경
```

**클라이언트 처리**:
- "병합 요청이 만료되었습니다. 다시 연동을 시도해주세요." 메시지 표시

---

## API 엔드포인트

### 계정 병합 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `POST` | `/api/account-merge/request` | 병합 요청 생성 (수동) | RefreshToken |
| `GET` | `/api/account-merge/:requestId` | 병합 요청 조회 | RefreshToken |
| `POST` | `/api/account-merge/:requestId/confirm` | 병합 승인 | RefreshToken |
| `POST` | `/api/account-merge/:requestId/reject` | 병합 거부 | RefreshToken |

### OAuth 연동 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `GET` | `/api/oauth/linked-accounts` | 연동된 OAuth 목록 조회 | RefreshToken |
| `POST` | `/api/oauth/link-google` | Google OAuth 연동 | RefreshToken |
| `POST` | `/api/oauth/link-naver` | Naver OAuth 연동 | RefreshToken |
| `DELETE` | `/api/oauth/unlink/:provider` | OAuth 연동 해제 | RefreshToken |

---

## 응답 DTO

### InitiateAccountMergeResponseDto
```typescript
interface InitiateAccountMergeResponseDto {
  requestId: number;
}
```

### GetAccountMergeResponseDto
```typescript
interface GetAccountMergeResponseDto {
  id: number;
  createdAt: Date;
  expiresAt: Date;
  provider: 'google' | 'naver';
  status: 'PENDING_EMAIL_VERIFICATION' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  sourceEmail: string;  // User B (삭제될 계정) 이메일
  targetEmail: string;  // User A (유지할 계정) 이메일
}
```

---

## 구현 필요 페이지/컴포넌트

### 1. OAuth 연동 관리 페이지

**경로**: `/settings/oauth` 또는 `/profile/oauth`

**기능**:
- 현재 연동된 OAuth 계정 목록 표시
- 새로운 OAuth provider 연동 버튼
- 연동 해제 버튼 (최소 1개는 유지)

**컴포넌트 구조**:
```
OAuthSettingsPage
├── LinkedAccountsList
│   ├── LinkedAccountItem (Google)
│   └── LinkedAccountItem (Naver)
└── LinkNewAccountSection
    ├── LinkGoogleButton
    └── LinkNaverButton
```

**409 에러 처리**:
```typescript
const handleLinkOAuth = async (provider: 'google' | 'naver') => {
  try {
    await linkOAuthAccount(provider);
    toast.success('연동이 완료되었습니다.');
    refetchLinkedAccounts();
  } catch (error) {
    if (error.response?.status === 409) {
      toast.info(
        '해당 OAuth 계정이 다른 사용자에게 연결되어 있습니다. ' +
        '계정 병합 요청이 생성되었으며, 해당 계정의 이메일을 확인해주세요.'
      );
    } else {
      toast.error('연동에 실패했습니다.');
    }
  }
};
```

---

### 2. 병합 확인 페이지

**경로**: `/oauth/merge/confirm`

**URL 파라미터**: `?token={confirmToken}`

**플로우**:
1. 토큰으로 Redis에서 requestId 조회 (서버 측)
2. requestId로 병합 요청 정보 조회
3. 병합 정보 표시 및 승인/거부 버튼

**컴포넌트 구조**:
```
MergeConfirmPage
├── MergeInfoCard
│   ├── SourceAccountInfo (삭제될 계정 - User B)
│   ├── TargetAccountInfo (유지할 계정 - User A)
│   ├── ProviderBadge
│   └── ExpirationTimer
├── WarningMessage
│   └── "승인 시 현재 계정의 모든 데이터가 대상 계정으로 이전되며,
│        현재 계정은 삭제됩니다."
└── ActionButtons
    ├── ConfirmButton (승인)
    └── RejectButton (거부)
```

**페이지 구현 예시**:
```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MergeConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [mergeInfo, setMergeInfo] = useState<GetAccountMergeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('유효하지 않은 링크입니다.');
      setLoading(false);
      return;
    }

    // 토큰으로 병합 요청 정보 조회
    fetchMergeInfoByToken(token)
      .then(setMergeInfo)
      .catch((err) => {
        if (err.code === 'ACCOUNT_MERGE_TOKEN_EXPIRED') {
          setError('병합 요청이 만료되었습니다.');
        } else {
          setError('병합 요청을 찾을 수 없습니다.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = async () => {
    if (!mergeInfo) return;

    try {
      await confirmAccountMerge(mergeInfo.id);
      // 성공 페이지로 이동
      router.push('/oauth/merge/success');
    } catch (error) {
      toast.error('병합에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleReject = async () => {
    if (!mergeInfo) return;

    try {
      await rejectAccountMerge(mergeInfo.id);
      // 거부 완료 페이지로 이동
      router.push('/oauth/merge/rejected');
    } catch (error) {
      toast.error('요청 처리에 실패했습니다.');
    }
  };

  // ... 렌더링 로직
}
```

---

### 3. 병합 결과 페이지

**경로**:
- `/oauth/merge/success` - 병합 성공
- `/oauth/merge/rejected` - 병합 거부
- `/oauth/merge/expired` - 요청 만료

**성공 페이지 내용**:
```
✅ 계정 병합이 완료되었습니다.

모든 데이터가 성공적으로 이전되었습니다.
기존 계정({targetEmail})으로 로그인해주세요.

[로그인 페이지로 이동]
```

**거부 페이지 내용**:
```
❌ 계정 병합 요청이 거부되었습니다.

양쪽 계정 모두 그대로 유지됩니다.

[홈으로 이동]
```

---

## 에러 코드 참고

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `ACCOUNT_MERGE_000` | 400 | 동일 계정 병합 시도 |
| `ACCOUNT_MERGE_001` | 400 | 이미 병합 완료됨 |
| `ACCOUNT_MERGE_002` | 400 | 잘못된 상태 전환 |
| `ACCOUNT_MERGE_003` | 403 | 권한 없음 (User B만 승인/거부 가능) |
| `ACCOUNT_MERGE_004` | 400 | 요청 만료 |
| `ACCOUNT_MERGE_100` | 500 | 요청 생성 실패 |
| `ACCOUNT_MERGE_101` | 500 | 실행 실패 (Saga 오류) |
| `ACCOUNT_MERGE_102` | 400 | 토큰 무효 또는 만료 |
| `ACCOUNT_MERGE_104` | 400 | 진행 중인 병합은 취소 불가 |
| `ACCOUNT_MERGE_105` | 404 | 요청을 찾을 수 없음 |

---

## 상태 흐름도

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌──────────────────────────────────┐                     │
│  PENDING_EMAIL_VERIFICATION      │                     │
│  (이메일 인증 대기)               │                     │
└──────────────────────────────────┘                     │
        │                    │                           │
        │ confirm()          │ reject() / 만료           │
        ▼                    ▼                           │
┌───────────────┐    ┌───────────────┐                   │
│  IN_PROGRESS  │    │   CANCELLED   │                   │
│  (진행 중)     │    │   (취소됨)     │                   │
└───────────────┘    └───────────────┘                   │
        │                                                │
        │ Saga 완료/실패                                  │
        ▼                                                │
┌───────────────┐    ┌───────────────┐                   │
│   COMPLETED   │    │    FAILED     │───────────────────┘
│   (완료)       │    │   (실패)      │  재시도 가능
└───────────────┘    └───────────────┘
```

---

## 주의사항

1. **로그인 필수**: 병합 확인/거부는 반드시 User B로 로그인된 상태에서만 가능
2. **권한 검증**: 서버에서 현재 로그인된 사용자가 sourceUserId(User B)와 일치하는지 검증
3. **만료 시간**: 병합 요청은 24시간 후 만료됨
4. **롤백**: Saga 실행 중 실패 시 자동으로 롤백 처리됨
5. **중복 요청**: 24시간 이내 동일한 병합 요청이 있으면 기존 요청 ID 반환
