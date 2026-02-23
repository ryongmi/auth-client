import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { AuthError } from '@/types';

interface ConfirmMergeParams {
  requestId: number;
  accessToken: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useConfirmMerge() {
  return useMutation<void, AuthError, ConfirmMergeParams>({
    mutationFn: ({ requestId, accessToken }) =>
      accountMergeService.confirmAccountMerge(requestId, accessToken),
  });
}
