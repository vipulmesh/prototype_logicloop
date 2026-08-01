import { NextResponse } from 'next/server';

import { hashPassword, normalizeRole, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = normalizeRole(body?.role);

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Name, email, password, and role are required.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const response = NextResponse.json({ user });
  setSessionCookie(response, user);
  return response;
}
