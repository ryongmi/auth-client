import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 지원을 위한 standalone 출력
  output: 'standalone',
  
  // 실험적 기능 설정
  experimental: {
    // Next.js 15에서는 appDir이 기본값이므로 제거
  },

  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // CORS 및 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      // 기본 경로를 로그인으로 리다이렉트는 page.tsx에서 처리
    ];
  },

  // 이미지 최적화 설정
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // 웹팩 설정 (필요 시)
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서 fs 모듈 사용 방지
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
