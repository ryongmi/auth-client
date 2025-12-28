import { NextResponse } from 'next/server';

export async function GET(): Promise<
  NextResponse<{
    status: string;
    timestamp: string;
    service: string;
  }>
> {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-client',
    },
    { status: 200 }
  );
}
