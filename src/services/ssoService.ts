import { authApi } from '@/lib/httpClient';
import { LoginRequest } from '@/types';

/**
 * SSO (Single Sign-On) 서비스
 * auth-client에서 SSO 로그인 처리를 위한 핵심 기능만 제공
 */
export class SSOService {
  private readonly domain = process.env.NEXT_PUBLIC_DOMAIN || 'krgeobuk.com';


  /**
   * SSO 로그인 처리 (다른 서비스에서 리다이렉트된 경우)
   * @param loginData 로그인 자격 증명
   * @param sessionId SSO 세션 ID
   */
  async processSSOLogin(loginData: LoginRequest, sessionId: string): Promise<string> {
    try {
      const response = await authApi.post<{ redirectUrl: string }>('/auth/sso/login', {
        ...loginData,
        sessionId
      });

      const { redirectUrl } = response.data;

      // auth-client에서는 토큰을 저장하지 않음 (서버에서 HTTP-only 쿠키로 처리)
      return redirectUrl;
    } catch (error) {
      // 에러는 상위 컴포넌트에서 처리하도록 전달
      // 운영 환경에서는 로그 수집 서비스로 전송
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('SSO 로그인 처리 실패:', error);
      }
      throw error;
    }
  }








}

// 싱글톤 인스턴스
export const ssoService = new SSOService();