import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'This auth endpoint is deprecated. Use /api/auth/register or /api/auth/login.' }, { status: 410 });
}
