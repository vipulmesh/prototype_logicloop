import { NextResponse, type NextRequest } from 'next/server';

import { getSessionFromCookieValue } from '@/lib/auth';

function isProtectedCandidatePath(pathname: string) {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/upload' || pathname.startsWith('/upload/');
}

function isProtectedRecruiterPath(pathname: string) {
  return pathname === '/recruiter' || pathname.startsWith('/recruiter/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/candidate/login' || pathname === '/candidate/register' || pathname === '/recruiter/login' || pathname === '/recruiter/register') {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get('talentai_session')?.value;
  const session = getSessionFromCookieValue(sessionValue);

  if (isProtectedCandidatePath(pathname)) {
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.redirect(new URL('/candidate/login', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRecruiterPath(pathname)) {
    if (!session || session.role !== 'RECRUITER') {
      return NextResponse.redirect(new URL('/recruiter/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/jobs', '/jobs/:path*', '/upload', '/recruiter', '/recruiter/:path*'],
};
