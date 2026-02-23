import { useMutation, useQueryClient } from '@tanstack/react-query';
import { oauthService } from '@/services/oauthService';
import type { AuthError } from '@/types';

interface UnlinkAccountParams {
  provider: string;
  accessToken: string;
}

export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, AuthError, UnlinkAccountParams>({
    mutationFn: ({ provider, accessToken }) =>
      oauthService.unlinkAccount(provider, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['linkedAccounts'] });
    },
  });
}
