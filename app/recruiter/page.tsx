'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Edit3,
  LogOut,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getApplications, saveApplications } from '@/lib/demo-jobs';
import type { JobApplication } from '@/types';

type PortalView = 'dashboard' | 'jobs' | 'company' | 'applicants';

interface CompanyProfile {
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
}

interface RecruiterJob {
  id: string;
  title: string;
  location: string;
  type: string;
  skills: string;
  description: string;
  createdAt: string;
}

const defaultCompany: CompanyProfile = {
  name: '', industry: '', location: '', website: '', description: '',
};

const emptyJob = (): Omit<RecruiterJob, 'id' | 'createdAt'> => ({
  title: '', location: '', type: 'Full-time', skills: '', description: '',
});

function readSession<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function JobForm({ job, onSave, onCancel }: { job: RecruiterJob | null; onSave: (job: Omit<RecruiterJob, 'id' | 'createdAt'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<RecruiterJob, 'id' | 'createdAt'>>(job ? {
    title: job.title, location: job.location, type: job.type, skills: job.skills, description: job.description,
  } : emptyJob());
  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return <Card className="mb-6"><h2 className="text-lg font-semibold">{job ? 'Edit job' : 'Create a job'}</h2><form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <label className="text-sm text-slate-300">Job title<input required value={form.title} onChange={(e) => setField('title', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Senior Frontend Engineer" /></label>
    <label className="text-sm text-slate-300">Location<input required value={form.location} onChange={(e) => setField('location', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Bengaluru / Remote" /></label>
    <label className="text-sm text-slate-300">Employment type<select value={form.type} onChange={(e) => setField('type', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
    <label className="text-sm text-slate-300">Key skills<input required value={form.skills} onChange={(e) => setField('skills', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="React, TypeScript, Next.js" /></label>
    <label className="text-sm text-slate-300 md:col-span-2">Description<textarea required rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Describe the role, responsibilities, and candidate profile." /></label>
    <div className="flex gap-3 md:col-span-2"><Button type="submit"><Save size={16} />{job ? 'Save changes' : 'Post job'}</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
  </form></Card>;
}

export default function RecruiterPortal() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const requestedView: PortalView = viewParam === 'jobs' || viewParam === 'company' || viewParam === 'applicants' ? viewParam : 'dashboard';
  const [isReady, setIsReady] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [loginName, setLoginName] = useState('');
  const [view, setView] = useState<PortalView>(requestedView);
  const [company, setCompany] = useState(defaultCompany);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showForm, setShowForm] = useState(searchParams.get('create') === 'true');
  const [editingJob, setEditingJob] = useState<RecruiterJob | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplication | null>(null);

  useEffect(() => {
    const savedName = sessionStorage.getItem('talentai_recruiter');
    setRecruiterName(savedName || '');
    setCompany(readSession('talentai_company', defaultCompany));
    setJobs(readSession('talentai_recruiter_jobs', []));
    setApplications(getApplications());
    setView(requestedView);
    setShowForm(searchParams.get('create') === 'true');
    setIsReady(true);
  }, [requestedView, searchParams]);

  const persistJobs = (nextJobs: RecruiterJob[]) => { setJobs(nextJobs); sessionStorage.setItem('talentai_recruiter_jobs', JSON.stringify(nextJobs)); };
  const saveJob = (job: Omit<RecruiterJob, 'id' | 'createdAt'>) => {
    const nextJobs = editingJob
      ? jobs.map((current) => current.id === editingJob.id ? { ...current, ...job } : current)
      : [{ ...job, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...jobs];
    persistJobs(nextJobs); setShowForm(false); setEditingJob(null);
  };
  const deleteJob = (id: string) => persistJobs(jobs.filter((job) => job.id !== id));
  const updateApplication = (id: string, status: JobApplication['status']) => {
    const nextApplications = applications.map((application) => application.id === id ? { ...application, status } : application);
    setApplications(nextApplications);
    saveApplications(nextApplications);
    setSelectedApplicant((current) => current?.id === id ? { ...current, status } : current);
  };
  const submitLogin = (event: FormEvent) => { event.preventDefault(); const name = loginName.trim(); if (name) { sessionStorage.setItem('talentai_recruiter', name); setRecruiterName(name); } };
  const logout = () => { sessionStorage.removeItem('talentai_recruiter'); setRecruiterName(''); setView('dashboard'); };

  if (!isReady) return null;
  if (!recruiterName) return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link></nav><main className="relative z-10 mx-auto flex min-h-[75vh] max-w-md items-center px-6"><Card className="w-full"><Badge variant="accent">Recruiter Portal</Badge><h1 className="mt-4 text-2xl font-bold">Welcome back</h1><p className="mt-2 text-sm text-slate-400">Sign in to manage your company and open roles.</p><form className="mt-6" onSubmit={submitLogin}><label className="text-sm text-slate-300">Your name<input required value={loginName} onChange={(e) => setLoginName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Alex Morgan" /></label><Button className="mt-5 w-full" type="submit">Enter recruiter portal</Button></form></Card></main></div>;

  const navigation: { id: PortalView; label: string; href: string; icon: typeof BarChart3 }[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/recruiter/dashboard', icon: BarChart3 },
    { id: 'jobs', label: 'My jobs', href: '/recruiter/jobs', icon: BriefcaseBusiness },
    { id: 'applicants', label: 'Applicants', href: '/recruiter/applicants', icon: Users },
    { id: 'company', label: 'Company profile', href: '/recruiter/company', icon: Building2 },
  ];
  return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link><Button variant="ghost" size="sm" onClick={logout}><LogOut size={15} /> Log out</Button></nav><main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-6"><div className="flex flex-col gap-6 lg:flex-row"><aside className="lg:w-56"><Card className="p-3"><p className="px-3 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{recruiterName}</p>{navigation.map((item) => <Link key={item.id} href={item.href} onClick={() => { setView(item.id); setShowForm(false); setEditingJob(null); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${view === item.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={17} />{item.label}</Link>)}</Card></aside><section className="min-w-0 flex-1">
    {view === 'dashboard' && <><Badge variant="default">Recruiter dashboard</Badge><h1 className="mt-4 text-3xl font-bold">Hiring overview</h1><p className="mt-2 text-slate-400">Manage your open roles and company profile from one place.</p><div className="mt-7 grid gap-5 sm:grid-cols-3"><Card><BriefcaseBusiness className="h-5 w-5 text-primary" /><p className="mt-4 text-3xl font-bold">{jobs.length}</p><p className="mt-1 text-sm text-muted-foreground">Posted jobs</p></Card><Card><Users className="h-5 w-5 text-accent" /><p className="mt-4 text-3xl font-bold">{applications.length}</p><p className="mt-1 text-sm text-muted-foreground">Applicants</p></Card><Card><Building2 className="h-5 w-5 text-emerald-400" /><p className="mt-4 truncate text-xl font-bold">{company.name || 'Set up'}</p><p className="mt-1 text-sm text-muted-foreground">Company profile</p></Card></div><Card className="mt-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent jobs</h2><Button size="sm" onClick={() => setView('jobs')}><Plus size={15} /> Manage jobs</Button></div>{jobs.length ? <div className="mt-4 space-y-3">{jobs.slice(0, 3).map((job) => <div key={job.id} className="flex items-center justify-between rounded-xl bg-black/20 p-4"><div><p className="font-medium">{job.title}</p><p className="mt-1 text-sm text-muted-foreground">{job.location} · {job.type}</p></div><Badge variant="success">Open</Badge></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No roles posted yet. Create your first job to begin matching candidates.</p>}</Card></>}
    {view === 'jobs' && <><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge variant="accent">Job management</Badge><h1 className="mt-4 text-3xl font-bold">Posted jobs</h1><p className="mt-2 text-slate-400">Create and manage roles for your hiring team.</p></div><Button onClick={() => { setEditingJob(null); setShowForm(true); }}><Plus size={16} /> Create job</Button></div>{showForm && <div className="mt-6"><JobForm job={editingJob} onSave={saveJob} onCancel={() => { setShowForm(false); setEditingJob(null); }} /></div>}<div className="mt-6 space-y-4">{jobs.length ? jobs.map((job) => <Card key={job.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{job.title}</h2><Badge variant="success">Open</Badge></div><p className="mt-1 text-sm text-muted-foreground">{job.location} · {job.type}</p><p className="mt-3 text-sm leading-relaxed text-slate-400">{job.description}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.split(',').map((skill) => <Badge key={skill} variant="muted">{skill.trim()}</Badge>)}</div></div><div className="flex h-fit flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => { setSelectedJobId(job.id); setView('applicants'); }}><Users size={14} /> Applicants</Button><Button variant="ghost" size="sm" onClick={() => { setEditingJob(job); setShowForm(true); }}><Edit3 size={14} /> Edit</Button><Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)}><Trash2 size={14} /> Delete</Button></div></div></Card>) : <Card className="text-center"><BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No jobs posted</h2><p className="mt-2 text-sm text-muted-foreground">Create your first role to start building a candidate pipeline.</p></Card>}</div></>}
    {view === 'applicants' && <><Badge variant="default">Candidate pipeline</Badge><h1 className="mt-4 text-3xl font-bold">Applicants</h1><p className="mt-2 text-slate-400">Review the resumes and AI signals for every application.</p>{selectedApplicant && <Card className="mt-6 border border-primary/30"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{selectedApplicant.candidateName}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedApplicant.resumeName} · {selectedApplicant.jobTitle}</p><div className="mt-4 flex flex-wrap gap-2">{selectedApplicant.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></div><Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)}>Close profile</Button></div></Card>}<div className="mt-6 flex flex-wrap gap-2"><Button variant={selectedJobId ? 'ghost' : 'primary'} size="sm" onClick={() => setSelectedJobId(null)}>All applicants</Button>{jobs.map((job) => <Button key={job.id} variant={selectedJobId === job.id ? 'primary' : 'ghost'} size="sm" onClick={() => setSelectedJobId(job.id)}>{job.title}</Button>)}</div><div className="mt-5 space-y-4">{applications.filter((application) => !selectedJobId || application.jobId === selectedJobId).length ? applications.filter((application) => !selectedJobId || application.jobId === selectedJobId).map((application) => <Card key={application.id} className="p-5"><div className="flex flex-col justify-between gap-5 lg:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{application.candidateName}</h2><Badge variant={application.status === 'Shortlisted' ? 'success' : application.status === 'Rejected' ? 'warning' : 'default'}>{application.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Applied to {application.jobTitle} · {new Date(application.appliedAt).toLocaleDateString()}</p><p className="mt-3 text-sm text-slate-300">Resume: {application.resumeName}</p><div className="mt-3 flex flex-wrap gap-2">{application.skills.map((skill) => <Badge key={skill} variant="muted">{skill}</Badge>)}</div></div><div className="flex flex-col gap-3"><div className="flex gap-3"><Badge variant="accent">Talent {application.talentScore}</Badge><Badge variant="success">ATS {application.atsScore}</Badge></div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(application)}>View profile</Button><Button size="sm" onClick={() => updateApplication(application.id, 'Shortlisted')}>Shortlist</Button><Button variant="ghost" size="sm" onClick={() => updateApplication(application.id, 'Rejected')}>Reject</Button></div></div></div></Card>) : <Card className="mt-5 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No applicants yet</h2><p className="mt-2 text-sm text-muted-foreground">Applications submitted from the candidate jobs board will appear here.</p></Card>}</div></>}
    {view === 'company' && <><Badge variant="success">Company profile</Badge><h1 className="mt-4 text-3xl font-bold">Your company</h1><p className="mt-2 text-slate-400">Keep this profile current for better candidate context.</p><Card className="mt-6"><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); sessionStorage.setItem('talentai_company', JSON.stringify(company)); }}><label className="text-sm text-slate-300">Company name<input required value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" /></label><label className="text-sm text-slate-300">Industry<input value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Technology" /></label><label className="text-sm text-slate-300">Location<input value={company.location} onChange={(e) => setCompany({ ...company, location: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Mumbai, India" /></label><label className="text-sm text-slate-300">Website<input type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="https://example.com" /></label><label className="text-sm text-slate-300 md:col-span-2">About the company<textarea rows={5} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Tell candidates about your mission and culture." /></label><div className="md:col-span-2"><Button type="submit"><Save size={16} /> Save profile</Button></div></form></Card></>}
  </section></div></main></div>;
}
