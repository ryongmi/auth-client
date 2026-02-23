import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, LoginResponse, AuthError } from '@/types';

interface LoginParams {
  loginData: LoginRequest;
  redirectSession?: string;
}

export function useLogin() {
  const { incrementLoginAttempts, resetLoginAttempts } = useAuthStore();

  return useMutation<LoginResponse, AuthError, LoginParams>({
    mutationFn: ({ loginData, redirectSession }) =>
      authService.login(loginData, redirectSession),
    onSuccess: () => {
      resetLoginAttempts();
    },
    onError: () => {
      incrementLoginAttempts();
    },
  });
}
