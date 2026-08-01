import Link from 'next/link';
import { Button } from '@/components/ui';
import { Logo } from '@/components/nav/Logo';

export function MarketingNav() {
  return (
    <nav className="enterprise-nav relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
      <Logo />
      <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
        <a className="transition hover:text-white" href="#product">Product</a>
        <Link className="transition hover:text-white" href="/candidate">Candidates</Link>
        <Link className="transition hover:text-white" href="/recruiter">Recruiters</Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/candidate"><Button variant="ghost" size="sm">Candidate</Button></Link>
        <Link href="/recruiter"><Button size="sm">Recruiter</Button></Link>
      </div>
    </nav>
  );
}
