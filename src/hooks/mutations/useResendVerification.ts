import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useResendVerification() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (email) => authService.requestEmailVerification(email),
  });
}
