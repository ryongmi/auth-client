import { useEffect, useRef } from 'react';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

/** authService.initialize() 반환 타입 */
type AuthInitResult = Awaited<ReturnType<typeof authService.initialize>>;

function isUnauthorized(error: AuthError): boolean {
  return error.code === 'HTTP_401' || error.code === 'UNAUTHORIZED';
}

interface UseAuthInitializeOptions {
  /** false로 설정하면 초기화를 지연 (조건부 실행) */
  enabled?: boolean;
  /** 초기화 성공 시 호출 (추가 비동기 작업 가능) */
  onSuccess: (result: AuthInitResult) => void | Promise<void>;
  /** 401 인증 실패 시 호출 (미제공 시 onError로 전달) */
  onUnauthorized?: (error: AuthError) => void;
  /** 일반 에러 시 호출 */
  onError: (error: AuthError) => void;
}

/**
 * 인증 초기화 훅
 *
 * authService.initialize()를 호출하여 accessToken과 user 정보를 획득하고,
 * 401 에러와 일반 에러를 분리하여 처리합니다.
 *
 * onSuccess 콜백 내에서 발생하는 에러도 동일하게 처리됩니다.
 */
export function useAuthInitialize({
  enabled = true,
  onSuccess,
  onUnauthorized,
  onError,
}: UseAuthInitializeOptions): void {
  const onSuccessRef = useRef(onSuccess);
  const onUnauthorizedRef = useRef(onUnauthorized);
  const onErrorRef = useRef(onError);

  onSuccessRef.current = onSuccess;
  onUnauthorizedRef.current = onUnauthorized;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled) return;

    const initialize = async (): Promise<void> => {
      try {
        const initData = await authService.initialize();
        await onSuccessRef.current(initData);
      } catch (err) {
        const authError = err as AuthError;
        if (isUnauthorized(authError) && onUnauthorizedRef.current) {
          onUnauthorizedRef.current(authError);
        } else {
          onErrorRef.current(authError);
        }
      }
    };

    void initialize();
  }, [enabled]);
}
