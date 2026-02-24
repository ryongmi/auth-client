import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { InitiateAccountMergeDto, AccountMergeInitiateResponse, AuthError } from '@/types';

interface InitiateMergeParams {
  dto: InitiateAccountMergeDto;
  accessToken: string;
}

interface ConfirmMergeParams {
  requestId: number;
  accessToken: string;
}

interface RejectMergeParams {
  requestId: number;
  accessToken: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useInitiateMerge() {
  return useMutation<AccountMergeInitiateResponse, AuthError, InitiateMergeParams>({
    mutationFn: ({ dto, accessToken }) =>
      accountMergeService.initiateAccountMerge(dto, accessToken),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useConfirmMerge() {
  return useMutation<void, AuthError, ConfirmMergeParams>({
    mutationFn: ({ requestId, accessToken }) =>
      accountMergeService.confirmAccountMerge(requestId, accessToken),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useRejectMerge() {
  return useMutation<void, AuthError, RejectMergeParams>({
    mutationFn: ({ requestId, accessToken }) =>
      accountMergeService.rejectAccountMerge(requestId, accessToken),
  });
}
