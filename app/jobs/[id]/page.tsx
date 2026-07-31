'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BrainCircuit, CheckCircle2, MapPin } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getApplications, getAvailableJobs, saveApplications } from '@/lib/demo-jobs';
import { getCachedAnalysis } from '@/lib/analysis-cache';
import type { Job, JobApplication } from '@/types';

interface StoredResume {
  fileName: string | null;
  fingerprint: { fileName: string | null; fileSize: number | null; lastModified: number | null };
}

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<JobApplication['status'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const found = getAvailableJobs().find((item) => item.id === params.id) || null; setJob(found); setApplicationStatus(getApplications().find((application) => application.jobId === params.id)?.status ?? null); }, [params.id]);

  const apply = () => {
    if (!job) return;
    const resume = (() => { try { return JSON.parse(localStorage.getItem('talentai_resume') || sessionStorage.getItem('talentai_resume') || 'null') as StoredResume | null; } catch { return null; } })();
    const report = resume?.fingerprint ? getCachedAnalysis(resume.fingerprint)?.report : null;
    if (!resume?.fileName || !report) { setError('Analyze a resume first, then return to apply with one click.'); return; }
    if (getApplications().some((application) => application.jobId === job.id)) { setApplicationStatus(getApplications().find((application) => application.jobId === job.id)?.status ?? 'Pending'); return; }
    const application: JobApplication = { id: crypto.randomUUID(), jobId: job.id, jobTitle: job.title, candidateName: resume.fileName.replace(/\.[^.]+$/, ''), resumeName: resume.fileName, talentScore: report.overallScore, atsScore: report.atsScore, skills: report.technicalSkills, appliedAt: new Date().toISOString(), status: 'Pending', analysis: report };
    saveApplications([application, ...getApplications()]); setApplicationStatus(application.status); setError(null);
  };

  if (!job) return <div className="min-h-screen grid-bg"><main className="mx-auto max-w-xl px-6 py-28 text-center"><Card><h1 className="text-xl font-bold">Job not found</h1><Link className="mt-5 inline-flex" href="/jobs"><Button>Browse jobs</Button></Link></Card></main></div>;
  return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link><Link href="/jobs"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> All jobs</Button></Link></nav><main className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-8"><Card><div className="flex flex-col justify-between gap-5 md:flex-row"><div><Badge variant="success">Open role</Badge><h1 className="mt-4 text-3xl font-bold">{job.title}</h1><p className="mt-2 text-lg text-primary">{job.company}</p><p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={14} />{job.location} · {job.type} · {job.salary}</p></div>{applicationStatus ? <div className="self-start rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"><div className="flex items-center gap-2"><CheckCircle2 size={18} /> Applied</div><p className="mt-1 text-xs text-emerald-300/80">Application status: {applicationStatus}</p></div> : <Button size="lg" onClick={apply}>Apply with my resume</Button>}</div><div className="mt-8 border-t border-border pt-6"><h2 className="text-lg font-semibold">About the role</h2><p className="mt-3 leading-relaxed text-slate-400">{job.description}</p><h2 className="mt-7 text-lg font-semibold">Key skills</h2><div className="mt-3 flex flex-wrap gap-2">{job.skills.map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}</div></div>{error && <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-300">{error} <Link className="underline" href="/upload">Upload a resume</Link></p>}</Card></main></div>;
}
