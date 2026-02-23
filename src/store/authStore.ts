import { create } from 'zustand';
import { AUTH_CONFIG } from '@/config/constants';

interface AuthStore {
  loginAttempts: number;
  isBlocked: boolean;
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  loginAttempts: 0,
  isBlocked: false,

  incrementLoginAttempts: () => {
    const attempts = get().loginAttempts + 1;
    set({
      loginAttempts: attempts,
      isBlocked: attempts >= AUTH_CONFIG.LOGIN_MAX_ATTEMPTS,
    });
  },

  resetLoginAttempts: () => {
    set({ loginAttempts: 0, isBlocked: false });
  },
}));
