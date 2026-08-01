import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

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

  try {
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

    const sessionUser = { ...user, role };
    const response = NextResponse.json({ user: sessionUser });
    setSessionCookie(response, sessionUser);
    return response;
  } catch (error) {
    console.error('Registration failed', { email, role, error });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json({ error: 'The account database is not ready. Please apply the latest database migrations.' }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Unable to create account. Please try again.' }, { status: 500 });
  }
}
