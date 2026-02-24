import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type {
  LoginRequest,
  LoginResponse,
  ExtendedSignupRequest,
  SignupResponse,
  ForgotPasswordFormData,
  AuthError,
} from '@/types';

interface LoginParams {
  loginData: LoginRequest;
  redirectSession?: string;
}

interface SignupParams {
  signupData: ExtendedSignupRequest;
  redirectSession?: string;
}

interface ResetPasswordParams {
  token: string;
  password: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSignup() {
  return useMutation<SignupResponse, AuthError, SignupParams>({
    mutationFn: ({ signupData, redirectSession }) =>
      authService.signup(signupData, redirectSession),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useForgotPassword() {
  return useMutation<{ message: string }, AuthError, ForgotPasswordFormData>({
    mutationFn: (data) => authService.forgotPassword(data),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useResetPassword() {
  return useMutation<{ message: string }, AuthError, ResetPasswordParams>({
    mutationFn: (data) => authService.resetPassword({ ...data, confirmPassword: data.password }),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useVerifyEmail() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (token) => authService.verifyEmail(token),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useResendVerification() {
  return useMutation<{ message: string }, AuthError, string>({
    mutationFn: (email) => authService.requestEmailVerification(email),
  });
}
