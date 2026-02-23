import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { InitiateAccountMergeDto, AccountMergeInitiateResponse, AuthError } from '@/types';

interface InitiateMergeParams {
  dto: InitiateAccountMergeDto;
  accessToken: string;
}

export function useInitiateMerge() {
  return useMutation<AccountMergeInitiateResponse, AuthError, InitiateMergeParams>({
    mutationFn: ({ dto, accessToken }) =>
      accountMergeService.initiateAccountMerge(dto, accessToken),
  });
}
