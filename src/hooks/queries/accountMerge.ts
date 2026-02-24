import { useQuery } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';
import { queryKeys } from './keys';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useVerifyMergeToken(token: string | null) {
  return useQuery<{ requestId: number }, AuthError>({
    queryKey: queryKeys.accountMerge.verifyToken(token),
    queryFn: () => accountMergeService.verifyToken(token!),
    enabled: !!token,
    retry: false,
  });
}
