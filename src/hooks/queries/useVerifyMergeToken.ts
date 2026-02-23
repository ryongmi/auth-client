import { useQuery } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';

export function useVerifyMergeToken(token: string | null) {
  return useQuery<{ requestId: number }, AuthError>({
    queryKey: ['verifyMergeToken', token],
    queryFn: () => accountMergeService.verifyToken(token!),
    enabled: !!token,
    retry: false,
  });
}
