import { apiClient } from '@/lib/httpClient';
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
      const response = await apiClient.post<{ redirectUrl: string }>('/auth/sso/login', {
        ...loginData,
        sessionId
      });

      const { redirectUrl } = response.data.data;

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



  /**
   * 세션 관련 쿠키 정리 (토큰은 서버에서 HTTP-only로 관리)
   */
  private clearSessionCookies(): void {
    const cookieOptions = {
      domain: `.${this.domain}`,
      path: '/',
    };

    // 세션 관련 쿠키만 정리
    document.cookie = `session-id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${this.formatCookieOptions(cookieOptions)}`;
    document.cookie = `csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${this.formatCookieOptions(cookieOptions)}`;
  }


  /**
   * 쿠키 옵션을 문자열로 포맷
   */
  private formatCookieOptions(options: { domain?: string; path?: string; secure?: boolean; sameSite?: string }): string {
    const parts: string[] = [];
    if (options.domain) parts.push(`domain=${options.domain}`);
    if (options.path) parts.push(`path=${options.path}`);
    if (options.secure) parts.push('secure');
    if (options.sameSite) parts.push(`samesite=${options.sameSite}`);
    return parts.join('; ');
  }





}

// 싱글톤 인스턴스
export const ssoService = new SSOService();