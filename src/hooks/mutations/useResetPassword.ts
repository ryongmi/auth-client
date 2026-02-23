import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { AuthError } from '@/types';

interface ResetPasswordParams {
  token: string;
  password: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useResetPassword() {
  return useMutation<{ message: string }, AuthError, ResetPasswordParams>({
    mutationFn: (data) => authService.resetPassword({ ...data, confirmPassword: data.password }),
  });
}
