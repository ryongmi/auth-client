import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useVerifyEmail() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (token) => authService.verifyEmail(token),
  });
}
