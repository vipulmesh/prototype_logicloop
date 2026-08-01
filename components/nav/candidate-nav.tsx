'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Logo } from '@/components/nav/Logo';

export function CandidateNav() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/candidate/login');
  };

  return (
    <nav className="enterprise-nav relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
      <Logo />
      <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
        <Link className="text-slate-200" href="/candidate">For candidates</Link>
        <Link className="transition hover:text-white" href="/upload">Resume analysis</Link>
        <Link className="transition hover:text-white" href="/jobs">Open roles</Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/"><Button variant="ghost" size="sm">Home</Button></Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
      </div>
    </nav>
  );
}
