import { NextResponse, type NextRequest } from 'next/server';

import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    console.warn('Session check rejected: no valid session cookie');
    return NextResponse.json({ error: 'No active session.' }, { status: 401 });
  }

  console.info('Session check succeeded', { userId: session.id, role: session.role });
  return NextResponse.json({ user: session });
}
