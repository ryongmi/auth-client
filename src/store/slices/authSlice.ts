import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';
import {
  LoginRequest,
  ExtendedSignupRequest,
  SignupResponse,
  AuthError,
  LoginResponse,
} from '@/types';
import { clearAuthCookies } from '@/lib/httpClient';

interface AuthState {
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  isBlocked: boolean;
}

const initialState: AuthState = {
  isLoading: false,
  error: null,
  loginAttempts: 0,
  isBlocked: false,
};

// 로그인 (SSO 지원)
export const loginUser = createAsyncThunk<
  LoginResponse,
  { loginData: LoginRequest; redirectSession?: string },
  { rejectValue: AuthError }
>('auth/login', async ({ loginData, redirectSession }, { rejectWithValue }) => {
  try {
    const response = await authService.login(loginData, redirectSession);

    return response;
  } catch (error) {
    return rejectWithValue(error as AuthError);
  }
});

// 회원가입
export const signupUser = createAsyncThunk<
  SignupResponse,
  ExtendedSignupRequest,
  { rejectValue: AuthError }
>('auth/signup', async (signupData, { rejectWithValue }) => {
  try {
    const response = await authService.signup(signupData);
    return response;
  } catch (error) {
    return rejectWithValue(error as AuthError);
  }
});


// 로그아웃 (세션 정리만 수행)
export const logoutUser = createAsyncThunk<void, void, { rejectValue: AuthError }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      clearAuthCookies(); // 토큰이 아닌 세션 쿠키만 정리
    } catch (error) {
      // 로그아웃 실패해도 쿠키는 정리
      clearAuthCookies();
      return rejectWithValue(error as AuthError);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },

    // 성공 상태 설정 (OAuth 콜백에서 사용)
    setSuccess: (state) => {
      state.error = null;
      state.isLoading = false;
    },

    // 로그인 시도 횟수 증가
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      if (state.loginAttempts >= 5) {
        state.isBlocked = true;
      }
    },

    // 로그인 시도 횟수 초기화
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.isBlocked = false;
    },

    // OAuth 성공 처리 (사용자 정보 저장 없이)
    setOAuthSuccess: (state) => {
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // 로그인
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // 로그인 성공 시 시도 횟수 리셋
        state.loginAttempts = 0;
        state.isBlocked = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || '로그인에 실패했습니다.';
        state.loginAttempts += 1;
        if (state.loginAttempts >= 5) {
          state.isBlocked = true;
        }
      })

      // 회원가입
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // 회원가입 후 로그인 페이지로 이동
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || '회원가입에 실패했습니다.';
      })


      // 로그아웃
      .addCase(logoutUser.fulfilled, (state) => {
        state.error = null;
        state.loginAttempts = 0;
        state.isBlocked = false;
      });
  },
});

export const {
  clearError,
  setSuccess,
  incrementLoginAttempts,
  resetLoginAttempts,
  setOAuthSuccess,
} = authSlice.actions;

export default authSlice.reducer;
