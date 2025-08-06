import type { Metadata } from "next";
import "./globals.css";
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: "KRGeobuk Auth",
  description: "KRGeobuk 통합 인증 서비스",
  keywords: "auth, authentication, sso, krgeobuk",
  authors: [{ name: "KRGeobuk Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow", // 인증 페이지는 검색 엔진에서 제외
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
