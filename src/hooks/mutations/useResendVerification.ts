import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

export function useResendVerification() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (email) => authService.requestEmailVerification(email),
  });
}
