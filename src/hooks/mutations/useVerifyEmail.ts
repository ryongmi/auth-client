import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

export function useVerifyEmail() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (token) => authService.verifyEmail(token),
  });
}
