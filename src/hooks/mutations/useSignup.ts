import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { ExtendedSignupRequest, SignupResponse, AuthError } from '@/types';

interface SignupParams {
  signupData: ExtendedSignupRequest;
  redirectSession?: string;
}

export function useSignup() {
  return useMutation<SignupResponse, AuthError, SignupParams>({
    mutationFn: ({ signupData, redirectSession }) =>
      authService.signup(signupData, redirectSession),
  });
}
