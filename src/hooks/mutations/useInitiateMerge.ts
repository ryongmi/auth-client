import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { InitiateAccountMergeDto, AccountMergeInitiateResponse, AuthError } from '@/types';

interface InitiateMergeParams {
  dto: InitiateAccountMergeDto;
  accessToken: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useInitiateMerge() {
  return useMutation<AccountMergeInitiateResponse, AuthError, InitiateMergeParams>({
    mutationFn: ({ dto, accessToken }) =>
      accountMergeService.initiateAccountMerge(dto, accessToken),
  });
}
