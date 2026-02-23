import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';

interface RejectMergeParams {
  requestId: number;
  accessToken: string;
}

export function useRejectMerge() {
  return useMutation<void, AuthError, RejectMergeParams>({
    mutationFn: ({ requestId, accessToken }) =>
      accountMergeService.rejectAccountMerge(requestId, accessToken),
  });
}
