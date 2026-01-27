interface LoadingSpinnerProps {
  title: string;
  description?: string;
}

/**
 * 페이지 내 로딩 스피너
 * 카드 내부에서 비동기 작업 진행 중 상태를 표시
 */
export function LoadingSpinner({
  title,
  description = '잠시만 기다려주세요.',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div className="text-center">
      <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
