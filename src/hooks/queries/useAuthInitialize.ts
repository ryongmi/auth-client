import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';
import type { UserProfile } from '@krgeobuk/user/interfaces';

interface AuthInitData {
  accessToken: string;
  user: UserProfile;
}

function isUnauthorized(error: AuthError): boolean {
  return error.code === 'HTTP_401' || error.code === 'UNAUTHORIZED';
}

interface UseAuthInitializeOptions {
  enabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAuthInitialize(options: UseAuthInitializeOptions = {}) {
  const { enabled = true } = options;

  return useQuery<AuthInitData, AuthError>({
    queryKey: ['authInitialize'],
    queryFn: () => authService.initialize(),
    enabled,
    retry: (failureCount, error) => {
      if (isUnauthorized(error)) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}
