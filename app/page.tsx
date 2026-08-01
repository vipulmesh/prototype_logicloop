import Link from 'next/link';
import { ArrowRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, FileSearch, Users } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { MarketingNav } from '@/components/nav/marketing-nav';

const audiences = [
  {
    title: 'For candidates',
    description: 'Understand your resume, see where your skills stand, and discover roles that fit your profile.',
    href: '/candidate',
    cta: 'Explore candidate tools',
    icon: FileSearch,
    points: ['AI resume analysis', 'Skills and ATS insights', 'Job matching'],
  },
  {
    title: 'For recruiters',
    description: 'Bring job posts, applicants, and talent signals into one focused hiring workspace.',
    href: '/recruiter',
    cta: 'Explore recruiter tools',
    icon: BriefcaseBusiness,
    points: ['Candidate ranking', 'Applicant pipeline', 'Job management'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <div className="relative grid-bg">
        <div className="orb -left-24 top-20 h-80 w-80 bg-primary" />
        <div className="orb right-0 top-0 h-96 w-96 bg-accent" />
        <MarketingNav />

        <main>
          <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
            <Badge variant="default" className="px-3 py-1">Talent intelligence for modern hiring</Badge>
            <div className="mt-7 grid items-end gap-10 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                  Better career decisions start with <span className="text-gradient">clearer talent signals.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  TalentAI gives candidates actionable resume insight and helps recruiting teams evaluate applicants with confidence.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link href="/candidate"><Button size="lg">I&apos;m a candidate <ArrowRight size={17} /></Button></Link>
                  <Link href="/recruiter"><Button variant="ghost" size="lg">I&apos;m a recruiter <BriefcaseBusiness size={17} /></Button></Link>
                </div>
              </div>
              <Card className="relative overflow-hidden p-6 sm:p-7">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-emphasis">One shared platform</p>
                <div className="mt-6 space-y-5">
                  <div className="flex gap-4"><div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Users size={18} /></div><div><h2 className="font-semibold text-slate-900">Candidates get direction</h2><p className="mt-1 text-sm leading-6 text-slate-600">Turn a resume into practical insight and relevant opportunities.</p></div></div>
                  <div className="flex gap-4"><div className="mt-0.5 rounded-lg bg-accent/10 p-2 text-accent"><BrainCircuit size={18} /></div><div><h2 className="font-semibold text-slate-900">Teams get context</h2><p className="mt-1 text-sm leading-6 text-slate-600">Review applicants with organized profiles and AI-assisted rankings.</p></div></div>
                </div>
              </Card>
            </div>
          </section>
        </main>
      </div>

      <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-24">
        <div className="max-w-2xl"><p className="text-sm font-semibold text-primary-emphasis">Choose your workspace</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Built for both sides of the hiring conversation.</h2><p className="mt-4 leading-7 text-slate-600">Start with the experience that fits your role. Your existing TalentAI tools remain exactly where you expect them.</p></div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {audiences.map((audience) => <Card key={audience.title} hover className="flex flex-col p-7 sm:p-8"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10"><audience.icon size={21} /></div><h3 className="mt-6 text-2xl font-semibold text-slate-900">{audience.title}</h3><p className="mt-3 max-w-md leading-7 text-slate-600">{audience.description}</p><ul className="mt-6 space-y-2.5 text-sm text-slate-700">{audience.points.map((point) => <li key={point} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" />{point}</li>)}</ul><Link href={audience.href} className="mt-8"><Button variant="ghost">{audience.cta} <ArrowRight size={16} /></Button></Link></Card>)}
        </div>
      </section>

      <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>© {new Date().getFullYear()} TalentAI</span><div className="flex gap-5"><Link className="hover:text-slate-900" href="/candidate">Candidates</Link><Link className="hover:text-slate-900" href="/recruiter">Recruiters</Link></div></div></footer>
    </div>
  );
}
