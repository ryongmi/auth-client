import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { ForgotPasswordFormData, AuthError } from '@/types';

export function useForgotPassword() {
  return useMutation<{ message: string }, AuthError, ForgotPasswordFormData>({
    mutationFn: (data) => authService.forgotPassword(data),
  });
}
