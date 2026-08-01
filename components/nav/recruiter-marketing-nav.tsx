import Link from 'next/link';
import { Button } from '@/components/ui';
import { Logo } from '@/components/nav/Logo';

export function RecruiterMarketingNav() {
  return (
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
      <Logo />
      <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
        <Link className="text-slate-200" href="/recruiter">For recruiters</Link>
        <Link className="transition hover:text-white" href="/recruiter/jobs">Job management</Link>
        <Link className="transition hover:text-white" href="/recruiter/applicants">Candidates</Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/"><Button variant="ghost" size="sm">Home</Button></Link>
        <Link href="/recruiter/login"><Button size="sm">Log in</Button></Link>
      </div>
    </nav>
  );
}
