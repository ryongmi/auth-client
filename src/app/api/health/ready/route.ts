import { NextResponse } from 'next/server';

export async function GET(): Promise<
  | NextResponse<{
      status: string;
      reason: string;
      timestamp: string;
      service: string;
    }>
  | NextResponse<{
      status: string;
      timestamp: string;
      service: string;
      config: {
        authServerUrl: string | undefined;
      };
    }>
> {
  // 환경변수 체크 (필수 설정 확인)
  const requiredEnvVars = ['NEXT_PUBLIC_AUTH_SERVER_URL'];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    return NextResponse.json(
      {
        status: 'not ready',
        reason: `Missing required environment variables: ${missingVars.join(', ')}`,
        timestamp: new Date().toISOString(),
        service: 'auth-client',
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'auth-client',
      config: {
        authServerUrl: process.env.NEXT_PUBLIC_AUTH_SERVER_URL,
      },
    },
    { status: 200 }
  );
}
