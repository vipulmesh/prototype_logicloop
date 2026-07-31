'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, BriefcaseBusiness, MapPin } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getAvailableJobs } from '@/lib/demo-jobs';
import type { Job } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => setJobs(getAvailableJobs()), []);

  return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link><Link href="/upload"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Upload resume</Button></Link></nav><main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8"><Badge variant="accent">Candidate opportunities</Badge><h1 className="mt-4 text-3xl font-bold md:text-4xl">Find your next role</h1><p className="mt-2 text-slate-400">Explore open roles and apply with your analyzed resume.</p><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{jobs.map((job) => <Card key={job.id} hover className="flex flex-col"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{job.title}</h2><p className="mt-1 text-sm text-primary">{job.company}</p></div><Badge variant="success">Open</Badge></div><p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={14} />{job.location} · {job.type}</p><p className="mt-3 text-sm leading-relaxed text-slate-400">{job.description}</p><div className="mt-4 flex flex-wrap gap-2">{job.skills.slice(0, 4).map((skill) => <Badge key={skill} variant="muted">{skill}</Badge>)}</div><div className="mt-6 flex items-center justify-between"><span className="text-sm font-medium text-slate-300">{job.salary}</span><Link href={`/jobs/${job.id}`}><Button size="sm"><BriefcaseBusiness size={15} /> View role</Button></Link></div></Card>)}</div></main></div>;
}
