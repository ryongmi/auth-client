import type { ReactNode } from 'react';

/**
 * 인증 페이지 레이아웃 variant
 * - form: 폼 페이지 (3색 그라데이션, 반응형 패딩, space-y-8 래퍼)
 * - card: 상태/결과 페이지 (2색 그라데이션, 흰색 카드)
 * - dashboard: 관리 페이지 (회색 배경, 넓은 컨테이너)
 */
export type AuthPageVariant = 'form' | 'card' | 'dashboard';

const outerStyles: Record<AuthPageVariant, string> = {
  form: 'min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8',
  card: 'min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4',
  dashboard: 'min-h-screen bg-gray-50 py-8',
};

const innerStyles: Record<AuthPageVariant, string> = {
  form: 'max-w-md w-full space-y-8',
  card: 'max-w-md w-full bg-white rounded-2xl shadow-xl p-8',
  dashboard: 'max-w-3xl mx-auto px-4',
};

const fallbackStyles: Record<AuthPageVariant, string> = {
  form: 'min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center',
  card: 'min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center',
  dashboard: 'min-h-screen flex items-center justify-center',
};

interface AuthPageLayoutProps {
  variant?: AuthPageVariant;
  className?: string;
  children: ReactNode;
}

/**
 * 인증 페이지 공통 레이아웃
 *
 * - form: 배경 그라데이션 + max-w-md 래퍼 (헤더/카드는 children에서 처리)
 * - card: 배경 그라데이션 + 흰색 카드 컨테이너
 * - dashboard: 회색 배경 + 넓은 컨테이너
 */
export function AuthPageLayout({
  variant = 'card',
  className,
  children,
}: AuthPageLayoutProps): React.JSX.Element {
  const outer = className
    ? `${outerStyles[variant]} ${className}`
    : outerStyles[variant];

  return (
    <div className={outer}>
      <div className={innerStyles[variant]}>{children}</div>
    </div>
  );
}

/**
 * Suspense fallback용 로딩 컴포넌트
 * AuthPageLayout과 동일한 배경에 스피너만 표시
 */
export function AuthPageFallback({
  variant = 'card',
}: {
  variant?: AuthPageVariant;
}): React.JSX.Element {
  return (
    <div className={fallbackStyles[variant]}>
      <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

/**
 * 폼 페이지용 카드 컨테이너
 * form variant 내부에서 사용하는 반투명 흰색 카드
 */
export function FormCard({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
      {children}
    </div>
  );
}
