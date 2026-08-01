import { NextResponse } from 'next/server';

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

  if (!user || user.role !== role) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const response = NextResponse.json({ user: safeUser });
  setSessionCookie(response, safeUser);
  return response;
}
