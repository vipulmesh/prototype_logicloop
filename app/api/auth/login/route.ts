import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { normalizeRole, setSessionCookie, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = normalizeRole(body?.role);

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Email, password, and role are required.' }, { status: 400 });
  }

  console.info('Login attempt', { email, role });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      console.warn('Login rejected: account not found', { email, role });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    if (user.role !== role) {
      console.warn('Login rejected: role mismatch', { email, requestedRole: role, storedRole: user.role });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      console.warn('Login rejected: password mismatch', { email, role });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role };
    const response = NextResponse.json({ user: safeUser });
    setSessionCookie(response, safeUser);
    console.info('Login succeeded', { userId: user.id, email, role });
    return response;
  } catch (error) {
    console.error('Login failed unexpectedly', { email, role, error });
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2021' || error.code === 'P2022')) {
      return NextResponse.json({ error: 'The account database is not ready. Please apply the latest database migrations.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 500 });
  }
}
