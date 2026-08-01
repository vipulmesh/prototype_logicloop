import { type NextRequest, type NextResponse } from 'next/server';

export const SESSION_COOKIE = 'talentai_session';
export type UserRole = 'CANDIDATE' | 'RECRUITER';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const role = value.trim().toUpperCase();
  if (role === 'CANDIDATE' || role === 'RECRUITER') {
    return role;
  }
  return null;
}

export async function hashPassword(password: string) {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, passwordHash);
}

export function setSessionCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
}

export function getSessionFromRequest(request: NextRequest | Request): SessionUser | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) return null;

  try {
    const value = decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
    const session = JSON.parse(value) as Partial<SessionUser>;
    if (typeof session.id === 'string' && typeof session.name === 'string' && typeof session.email === 'string' && normalizeRole(session.role)) {
      return {
        id: session.id,
        name: session.name,
        email: session.email,
        role: normalizeRole(session.role) as UserRole,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function getSessionFromCookieValue(value: string | undefined): SessionUser | null {
  if (!value) return null;

  try {
    const session = JSON.parse(value) as Partial<SessionUser>;
    if (typeof session.id === 'string' && typeof session.name === 'string' && typeof session.email === 'string' && normalizeRole(session.role)) {
      return {
        id: session.id,
        name: session.name,
        email: session.email,
        role: normalizeRole(session.role) as UserRole,
      };
    }
  } catch {
    return null;
  }

  return null;
}
