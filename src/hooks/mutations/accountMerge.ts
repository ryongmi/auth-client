import { useMutation } from '@tanstack/react-query';
import { accountMergeService } from '@/services/accountMergeService';
import type { InitiateAccountMergeDto, AccountMergeInitiateResponse, AuthError } from '@/types';

interface InitiateMergeParams {
  dto: InitiateAccountMergeDto;
}

interface ConfirmMergeParams {
  requestId: number;
}

interface RejectMergeParams {
  requestId: number;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useInitiateMerge() {
  return useMutation<AccountMergeInitiateResponse, AuthError, InitiateMergeParams>({
    mutationFn: ({ dto }) => accountMergeService.initiateAccountMerge(dto),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useConfirmMerge() {
  return useMutation<void, AuthError, ConfirmMergeParams>({
    mutationFn: ({ requestId }) => accountMergeService.confirmAccountMerge(requestId),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useRejectMerge() {
  return useMutation<void, AuthError, RejectMergeParams>({
    mutationFn: ({ requestId }) => accountMergeService.rejectAccountMerge(requestId),
  });
}
