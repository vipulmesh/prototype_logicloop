'use client';

import { FormEvent, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, BarChart3, BrainCircuit, BriefcaseBusiness, Building2,
  Edit3, LogOut, Plus, Save, Trash2, Users, ChevronDown, ChevronUp,
  Download, Loader2, PlayCircle, RefreshCw, AlertCircle, ShieldAlert, Trophy, CheckCircle2
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getApplications, saveApplications } from '@/lib/demo-jobs';
import type { JobApplication, CandidateRanking, Job, InterviewPrep } from '@/types';
import { getCachedCandidateRanking, saveCachedCandidateRanking } from '@/lib/candidate-ranking-cache';
import { getCachedInterviewPrep, saveCachedInterviewPrep } from '@/lib/interview-cache';
import { cn } from '@/lib/utils';

type PortalView = 'dashboard' | 'jobs' | 'company' | 'applicants' | 'hackathons';

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

const defaultCompany: CompanyProfile = { name: '', industry: '', location: '', website: '', description: '' };
const emptyJob = (): Omit<RecruiterJob, 'id' | 'createdAt'> => ({ title: '', location: '', type: 'Full-time', skills: '', description: '' });

function readSession<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getFraudDetection = (name: string) => {
  const hash = getHash(name);
  const overallRisk = 5 + (hash % 20);
  return {
    overallRisk,
    authenticity: 95 - (hash % 15),
    fakeResume: hash % 10,
    fakeCert: hash % 15,
    duplicate: (hash % 5) === 0 ? 80 : 0,
    aiGenerated: 10 + (hash % 30)
  };
};

const MOCK_HACKATHONS = [
  {
    id: 'h1',
    name: 'AI Innovation Hack 2026',
    team: 'Neural Knights',
    project: 'AutoDev: Self-healing Code',
    innovation: 96,
    technical: 92,
    business: 85,
    overall: 91,
    members: ['Alice Chen', 'Bob Smith'],
  },
  {
    id: 'h2',
    name: 'Global Fintech Challenge',
    team: 'BlockChain Bros',
    project: 'DeFi Micro-lending Platform',
    innovation: 88,
    technical: 85,
    business: 94,
    overall: 89,
    members: ['Charlie Davis'],
  },
  {
    id: 'h3',
    name: 'Web3 & Future Web',
    team: 'Quantum UX',
    project: 'Zero-latency UI Framework',
    innovation: 91,
    technical: 95,
    business: 78,
    overall: 88,
    members: ['Diana Prince', 'Evan Wright'],
  }
];

function HackathonsPipeline() {
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  
  return (
    <>
      <Badge variant="accent">Hackathon Sourcing</Badge>
      <h1 className="mt-4 text-3xl font-bold">Hackathon-to-Hiring Pipeline</h1>
      <p className="mt-2 text-slate-400">Discover and shortlist top talent directly from partner hackathons.</p>
      
      <div className="mt-8 space-y-6">
        {MOCK_HACKATHONS.map((h) => (
          <Card key={h.id} className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-5 mb-4">
              <div>
                <Badge variant="success" className="mb-2">{h.name}</Badge>
                <h2 className="text-xl font-bold text-white">{h.project}</h2>
                <p className="text-primary mt-1">Team: {h.team}</p>
                <div className="mt-3 flex gap-2 text-sm text-slate-300">
                  <span className="font-semibold text-slate-400">Members:</span>
                  {h.members.join(', ')}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                   <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Innovation</p>
                   <p className="text-2xl font-bold text-emerald-400">{h.innovation}</p>
                </div>
                <div className="text-center">
                   <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Overall Score</p>
                   <p className="text-2xl font-bold text-white">{h.overall}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 flex justify-between items-center">
              <div className="flex gap-4 text-sm">
                 <span className="text-slate-400">Technical: <span className="text-white font-medium">{h.technical}</span></span>
                 <span className="text-slate-400">Business: <span className="text-white font-medium">{h.business}</span></span>
              </div>
              <Button 
                variant={shortlisted[h.id] ? "ghost" : "primary"} 
                size="sm" 
                onClick={() => setShortlisted(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
              >
                {shortlisted[h.id] ? <><CheckCircle2 size={16} className="mr-2 text-success"/> Shortlisted</> : 'Shortlist Team'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
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

function ApplicantRankingCard({
  application,
  job,
  updateApplication,
  ranking,
  isLoadingRanking,
  error
}: {
  application: JobApplication;
  job?: Job;
  updateApplication: (id: string, status: JobApplication['status']) => void;
  ranking?: CandidateRanking;
  isLoadingRanking: boolean;
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [showPrep, setShowPrep] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);

  const matchScoreColor = ranking ? (ranking.matchScore >= 80 ? 'success' : ranking.matchScore >= 60 ? 'accent' : 'warning') : 'default';
  const fraud = getFraudDetection(application.candidateName);

  const fetchPrep = async (forceRegenerate = false) => {
    if (!forceRegenerate) {
      const cached = getCachedInterviewPrep(application.id, application.analysis, job);
      if (cached) {
        setPrep(cached);
        setShowPrep(true);
        return;
      }
    }
    
    setIsPrepLoading(true);
    setShowPrep(true);
    setPrepError(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, analysis: application.analysis })
      });
      const data = await res.json();
      if (!res.ok || !data.prep) throw new Error(data.error || 'Failed to generate prep.');
      
      saveCachedInterviewPrep(application.id, application.analysis, job, data.prep);
      setPrep(data.prep);
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : 'Error generating interview prep.');
    } finally {
      setIsPrepLoading(false);
    }
  };
  
  const downloadPrep = () => {
    if (!prep) return;
    let content = `AI Interview Preparation for ${application.candidateName}\n`;
    content += `Role: ${job?.title || 'General'}\n`;
    content += `Readiness Score: ${prep.readinessScore}/100\n\n`;
    prep.questions.forEach((q, i) => {
      content += `Q${i + 1} [${q.type.toUpperCase()}] [${q.difficulty}]: ${q.question}\n`;
      content += `Expected Key Points:\n`;
      q.expectedKeyPoints.forEach(p => {
        content += `- ${p}\n`;
      });
      content += `\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Prep_${application.candidateName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-5 lg:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{application.candidateName}</h2>
            <Badge variant={application.status === 'Shortlisted' ? 'success' : application.status === 'Rejected' ? 'warning' : 'default'}>{application.status}</Badge>
            {isLoadingRanking && <Badge variant="muted">Analyzing match...</Badge>}
            {error && <Badge variant="warning">Match failed</Badge>}
            {fraud.overallRisk > 20 && <Badge variant="warning"><ShieldAlert size={12} className="mr-1"/> High Risk</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Applied to {application.jobTitle} · {new Date(application.appliedAt).toLocaleDateString()}</p>
          <p className="mt-3 text-sm text-slate-300">Resume: {application.resumeName}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {ranking ? (
              <Badge variant={matchScoreColor as any}>Match {ranking.matchScore}%</Badge>
            ) : null}
            <Badge variant="accent">Talent {application.talentScore}</Badge>
            <Badge variant="success">ATS {application.atsScore}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            {ranking && (
               <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                 {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 {expanded ? 'Hide Insights' : 'AI Insights'}
               </Button>
            )}
            <Button size="sm" onClick={() => updateApplication(application.id, 'Shortlisted')}>Shortlist</Button>
            <Button variant="ghost" size="sm" onClick={() => updateApplication(application.id, 'Rejected')}>Reject</Button>
          </div>
          {ranking && (
            <div className="flex justify-end text-sm text-slate-400 mt-auto">
               Recommendation: <span className={cn('ml-1 font-semibold', ranking.hireRecommendation === 'Hire' ? 'text-emerald-400' : ranking.hireRecommendation === 'Consider' ? 'text-accent' : 'text-amber-400')}>{ranking.hireRecommendation}</span>
            </div>
          )}
        </div>
      </div>
      
      {expanded && ranking && (
         <div className="mt-6 border-t border-border pt-4">
           <h3 className="text-md font-semibold text-primary mb-2">AI Recruiter Summary</h3>
           <p className="text-sm text-slate-300 leading-relaxed">{ranking.recruiterSummary}</p>
           
           <div className="grid md:grid-cols-2 gap-6 mt-6">
             <div>
               <h4 className="text-sm font-semibold mb-2">Strengths</h4>
               <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                 {ranking.strengths.map((s, i) => <li key={i}>{s}</li>)}
               </ul>
             </div>
             <div>
               <h4 className="text-sm font-semibold mb-2">Weaknesses</h4>
               <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                 {ranking.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
               </ul>
             </div>
             <div>
               <h4 className="text-sm font-semibold mb-2">Matching Skills ({ranking.skillMatchPercentage}%)</h4>
               <div className="flex flex-wrap gap-2">
                 {ranking.matchingSkills.map((s, i) => <Badge key={i} variant="success">{s}</Badge>)}
               </div>
             </div>
             <div>
               <h4 className="text-sm font-semibold mb-2">Missing Skills</h4>
               <div className="flex flex-wrap gap-2">
                 {ranking.missingSkills.map((s, i) => <Badge key={i} variant="warning">{s}</Badge>)}
               </div>
             </div>
           </div>
           
           <div className="mt-6 flex items-center justify-between bg-black/20 p-4 rounded-xl border border-border">
             <span className="text-sm font-medium">Interview Readiness</span>
             <Badge variant={ranking.interviewReadiness >= 70 ? 'success' : ranking.interviewReadiness >= 50 ? 'accent' : 'warning'}>
               {ranking.interviewReadiness}/100
             </Badge>
           </div>

           <div className="mt-6 pt-4 border-t border-border/50">
             <h3 className="text-md font-semibold text-amber-400 mb-4 flex items-center gap-2"><ShieldAlert size={18}/> Fraud & Risk Analysis</h3>
             <div className="grid md:grid-cols-3 gap-4">
               <div className="bg-black/20 p-4 rounded-xl border border-border">
                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Overall Risk</p>
                 <p className={cn("text-2xl font-bold", fraud.overallRisk > 20 ? "text-amber-400" : "text-emerald-400")}>{fraud.overallRisk}%</p>
               </div>
               <div className="bg-black/20 p-4 rounded-xl border border-border">
                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Authenticity Score</p>
                 <p className="text-2xl font-bold text-emerald-400">{fraud.authenticity}%</p>
               </div>
               <div className="bg-black/20 p-4 rounded-xl border border-border">
                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">AI Generated Risk</p>
                 <p className={cn("text-2xl font-bold", fraud.aiGenerated > 25 ? "text-amber-400" : "text-emerald-400")}>{fraud.aiGenerated}%</p>
               </div>
             </div>
             <div className="mt-4 flex flex-wrap gap-3 text-sm">
               <Badge variant={fraud.duplicate > 50 ? "warning" : "success"}>Duplicate Profile: {fraud.duplicate > 50 ? 'High' : 'Low'}</Badge>
               <Badge variant={fraud.fakeResume > 10 ? "warning" : "success"}>Fake Resume Risk: {fraud.fakeResume}%</Badge>
               <Badge variant={fraud.fakeCert > 10 ? "warning" : "success"}>Fake Certificate Risk: {fraud.fakeCert}%</Badge>
             </div>
           </div>
           
           <div className="mt-6 pt-4 border-t border-border/50">
             {!showPrep ? (
               <Button variant="outline" size="sm" onClick={() => fetchPrep(false)}>
                 <PlayCircle size={15} /> Generate Interview Questions
               </Button>
             ) : (
               <div>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-md font-semibold text-primary">Interview Questions</h3>
                   <div className="flex gap-2">
                     <Button variant="ghost" size="sm" onClick={() => fetchPrep(true)} disabled={isPrepLoading}>
                       <RefreshCw size={14} className={isPrepLoading ? "animate-spin" : ""} /> Regenerate
                     </Button>
                     {prep && !isPrepLoading && (
                       <Button variant="ghost" size="sm" onClick={downloadPrep}>
                         <Download size={14} /> Download
                       </Button>
                     )}
                   </div>
                 </div>
                 
                 {isPrepLoading ? (
                   <div className="py-8 flex flex-col items-center justify-center text-center">
                     <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                     <p className="text-sm text-muted-foreground">Generating personalized interview questions...</p>
                   </div>
                 ) : prepError ? (
                   <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-center gap-2">
                     <AlertCircle size={16} /> {prepError}
                   </div>
                 ) : prep ? (
                   <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                     {prep.questions.map((q, i) => (
                       <div key={i} className="bg-black/20 p-4 rounded-xl border border-border">
                         <div className="flex items-center gap-2 mb-2">
                           <Badge variant="accent" className="text-[10px] capitalize px-1.5 py-0">{q.type}</Badge>
                           <Badge variant={q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Medium' ? 'warning' : 'default'} className="text-[10px] px-1.5 py-0">{q.difficulty}</Badge>
                         </div>
                         <p className="font-medium text-sm leading-relaxed mb-3">{i + 1}. {q.question}</p>
                         <div>
                           <span className="text-xs text-slate-400 block mb-1">Expected Key Points:</span>
                           <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                             {q.expectedKeyPoints.map((p, j) => <li key={j}>{p}</li>)}
                           </ul>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : null}
               </div>
             )}
           </div>
         </div>
      )}
    </Card>
  );
}

export default function RecruiterPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const requestedView: PortalView = viewParam === 'jobs' || viewParam === 'company' || viewParam === 'applicants' || viewParam === 'hackathons' ? viewParam : 'dashboard';
  const requestedJobId = searchParams.get('job');
  const requestedEditId = searchParams.get('edit');
  const [isReady, setIsReady] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [loginName, setLoginName] = useState('');
  const [company, setCompany] = useState(defaultCompany);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [rankings, setRankings] = useState<Record<string, CandidateRanking>>({});
  const [loadingRankings, setLoadingRankings] = useState<Record<string, boolean>>({});
  const [rankingErrors, setRankingErrors] = useState<Record<string, string>>({});
  const rankingTracker = useRef(new Set<string>());

  useEffect(() => {
    setRecruiterName(sessionStorage.getItem('talentai_recruiter') || '');
    setCompany(readSession('talentai_company', defaultCompany));
    setJobs(readSession('talentai_recruiter_jobs', []));
    setApplications(getApplications());
    setIsReady(true);
  }, [searchParams]);

  const persistJobs = (nextJobs: RecruiterJob[]) => {
    setJobs(nextJobs);
    sessionStorage.setItem('talentai_recruiter_jobs', JSON.stringify(nextJobs));
  };
  const saveJob = (job: Omit<RecruiterJob, 'id' | 'createdAt'>) => {
    const nextJobs = requestedEditId
      ? jobs.map((current) => current.id === requestedEditId ? { ...current, ...job } : current)
      : [{ ...job, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...jobs];
    persistJobs(nextJobs);
    router.push('/recruiter/jobs');
  };
  const deleteJob = (id: string) => {
    persistJobs(jobs.filter((job) => job.id !== id));
    router.push('/recruiter/jobs');
  };
  const updateApplication = (id: string, status: JobApplication['status']) => {
    const nextApplications = applications.map((application) => application.id === id ? { ...application, status } : application);
    setApplications(nextApplications);
    saveApplications(nextApplications);
  };
  const logout = () => { sessionStorage.removeItem('talentai_recruiter'); router.push('/recruiter'); };
  const editJob = jobs.find((job) => job.id === requestedEditId) ?? null;
  const detailJob = jobs.find((job) => job.id === requestedJobId) ?? null;
  const filteredApplications = applications.filter((application) => !requestedJobId || application.jobId === requestedJobId);
  const selectedApplicant = applications.find((application) => application.id === searchParams.get('applicant')) ?? null;

  const getMappedJob = (jobId: string): Job | undefined => {
    const recruiterJob = jobs.find(j => j.id === jobId);
    if (!recruiterJob) return undefined;
    return {
      id: recruiterJob.id,
      title: recruiterJob.title,
      company: company.name || 'Unknown Company',
      location: recruiterJob.location,
      type: recruiterJob.type,
      salary: 'Not specified',
      skills: recruiterJob.skills.split(',').map(s => s.trim()).filter(Boolean),
      description: recruiterJob.description,
    };
  };

  useEffect(() => {
    if (requestedView !== 'applicants') return;
    
    const newRankings: Record<string, CandidateRanking> = {};
    let hasNewCached = false;

    filteredApplications.forEach(app => {
      if (rankingTracker.current.has(app.id)) return;
      rankingTracker.current.add(app.id);

      const job = getMappedJob(app.jobId);
      if (!job) return;

      const cached = getCachedCandidateRanking(app, job);
      if (cached) {
        newRankings[app.id] = cached;
        hasNewCached = true;
      } else {
        setLoadingRankings(prev => ({ ...prev, [app.id]: true }));
        fetch('/api/rank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job, analysis: app.analysis })
        })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data.ranking) {
            saveCachedCandidateRanking(app, job, data.ranking);
            setRankings(prev => ({ ...prev, [app.id]: data.ranking }));
          } else {
            setRankingErrors(prev => ({ ...prev, [app.id]: data.error || 'Failed' }));
          }
        })
        .catch(e => {
          setRankingErrors(prev => ({ ...prev, [app.id]: 'Failed' }));
        })
        .finally(() => {
          setLoadingRankings(prev => ({ ...prev, [app.id]: false }));
        });
      }
    });

    if (hasNewCached) {
      setRankings(prev => ({ ...prev, ...newRankings }));
    }
  }, [requestedView, filteredApplications, jobs, company.name]);

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const scoreA = rankings[a.id]?.matchScore ?? -1;
    const scoreB = rankings[b.id]?.matchScore ?? -1;
    return scoreB - scoreA;
  });

  if (!isReady) return null;
  if (!recruiterName) return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link></nav><main className="relative z-10 mx-auto flex min-h-[75vh] max-w-md items-center px-6"><Card className="w-full"><Badge variant="accent">Recruiter Portal</Badge><h1 className="mt-4 text-2xl font-bold">Welcome back</h1><p className="mt-2 text-sm text-slate-400">Sign in to manage your company and open roles.</p><form className="mt-6" onSubmit={(event: FormEvent) => { event.preventDefault(); const name = loginName.trim(); if (name) { sessionStorage.setItem('talentai_recruiter', name); setRecruiterName(name); } }}><label className="text-sm text-slate-300">Your name<input required value={loginName} onChange={(e) => setLoginName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Alex Morgan" /></label><Button className="mt-5 w-full" type="submit">Enter recruiter portal</Button></form></Card></main></div>;

  const navigation: { id: PortalView; label: string; href: string; icon: typeof BarChart3 }[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/recruiter/dashboard', icon: BarChart3 },
    { id: 'jobs', label: 'My jobs', href: '/recruiter/jobs', icon: BriefcaseBusiness },
    { id: 'applicants', label: 'Applicants', href: '/recruiter/applicants', icon: Users },
    { id: 'hackathons', label: 'Hackathons', href: '/recruiter/hackathons', icon: Trophy },
    { id: 'company', label: 'Company profile', href: '/recruiter/company', icon: Building2 },
  ];

  return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link><Button variant="ghost" size="sm" onClick={logout}><LogOut size={15} /> Log out</Button></nav><main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-6"><div className="flex flex-col gap-6 lg:flex-row"><aside className="lg:w-56"><Card className="p-3"><p className="px-3 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{recruiterName}</p>{navigation.map((item) => <Link key={item.id} href={item.href} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${requestedView === item.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={17} />{item.label}</Link>)}</Card></aside><section className="min-w-0 flex-1">
    {requestedView === 'dashboard' && <><Badge variant="default">Recruiter dashboard</Badge><h1 className="mt-4 text-3xl font-bold">Hiring overview</h1><p className="mt-2 text-slate-400">Manage your open roles and company profile from one place.</p><div className="mt-7 grid gap-5 sm:grid-cols-3"><Card><BriefcaseBusiness className="h-5 w-5 text-primary" /><p className="mt-4 text-3xl font-bold">{jobs.length}</p><p className="mt-1 text-sm text-muted-foreground">Posted jobs</p></Card><Card><Users className="h-5 w-5 text-accent" /><p className="mt-4 text-3xl font-bold">{applications.length}</p><p className="mt-1 text-sm text-muted-foreground">Applicants</p></Card><Card><Building2 className="h-5 w-5 text-emerald-400" /><p className="mt-4 truncate text-xl font-bold">{company.name || 'Set up'}</p><p className="mt-1 text-sm text-muted-foreground">Company profile</p></Card></div><Card className="mt-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent jobs</h2><Link href="/recruiter/jobs"><Button size="sm"><Plus size={15} /> Manage jobs</Button></Link></div>{jobs.length ? <div className="mt-4 space-y-3">{jobs.slice(0, 3).map((job) => <Link key={job.id} href={`/recruiter/jobs/${job.id}`} className="flex items-center justify-between rounded-xl bg-black/20 p-4 transition hover:bg-white/5"><div><p className="font-medium">{job.title}</p><p className="mt-1 text-sm text-muted-foreground">{job.location} · {job.type}</p></div><Badge variant="success">Open</Badge></Link>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No roles posted yet. Create your first job to begin matching candidates.</p>}</Card></>}
    {requestedView === 'jobs' && detailJob && <><Link href="/recruiter/jobs"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> My jobs</Button></Link><Card className="mt-6"><div className="flex flex-col justify-between gap-5 md:flex-row"><div><Badge variant="success">Open role</Badge><h1 className="mt-4 text-3xl font-bold">{detailJob.title}</h1><p className="mt-2 text-sm text-muted-foreground">{detailJob.location} · {detailJob.type} · Posted {new Date(detailJob.createdAt).toLocaleDateString()}</p></div><div className="flex h-fit flex-wrap gap-2"><Link href={`/recruiter/jobs/${detailJob.id}/edit`}><Button variant="ghost" size="sm"><Edit3 size={14} /> Edit</Button></Link><Link href={`/recruiter/jobs/${detailJob.id}/applicants`}><Button size="sm"><Users size={14} /> View applicants</Button></Link></div></div><div className="mt-8 border-t border-border pt-6"><h2 className="text-lg font-semibold">About the role</h2><p className="mt-3 leading-relaxed text-slate-400">{detailJob.description}</p><h2 className="mt-7 text-lg font-semibold">Key skills</h2><div className="mt-3 flex flex-wrap gap-2">{detailJob.skills.split(',').filter(Boolean).map((skill) => <Badge key={skill} variant="muted">{skill.trim()}</Badge>)}</div></div></Card></>}
    {requestedView === 'jobs' && !detailJob && <><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge variant="accent">Job management</Badge><h1 className="mt-4 text-3xl font-bold">Posted jobs</h1><p className="mt-2 text-slate-400">Create and manage roles for your hiring team.</p></div><Link href="/recruiter/jobs/new"><Button><Plus size={16} /> Create job</Button></Link></div>{(searchParams.get('create') === 'true' || requestedEditId) && <div className="mt-6"><JobForm job={editJob} onSave={saveJob} onCancel={() => router.push('/recruiter/jobs')} /></div>}<div className="mt-6 space-y-4">{jobs.length ? jobs.map((job) => <Card key={job.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><Link href={`/recruiter/jobs/${job.id}`}><h2 className="text-lg font-semibold hover:text-primary">{job.title}</h2></Link><Badge variant="success">Open</Badge></div><p className="mt-1 text-sm text-muted-foreground">{job.location} · {job.type}</p><p className="mt-3 text-sm leading-relaxed text-slate-400">{job.description}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.split(',').filter(Boolean).map((skill) => <Badge key={skill} variant="muted">{skill.trim()}</Badge>)}</div></div><div className="flex h-fit flex-wrap gap-2"><Link href={`/recruiter/jobs/${job.id}/applicants`}><Button variant="ghost" size="sm"><Users size={14} /> Applicants</Button></Link><Link href={`/recruiter/jobs/${job.id}/edit`}><Button variant="ghost" size="sm"><Edit3 size={14} /> Edit</Button></Link><Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)}><Trash2 size={14} /> Delete</Button></div></div></Card>) : <Card className="text-center"><BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No jobs posted</h2><p className="mt-2 text-sm text-muted-foreground">Create your first role to start building a candidate pipeline.</p></Card>}</div></>}
    {requestedView === 'applicants' && <><Badge variant="default">Candidate pipeline</Badge><h1 className="mt-4 text-3xl font-bold">{requestedJobId ? detailJob?.title || 'Job applicants' : 'Applicants'}</h1><p className="mt-2 text-slate-400">Review the resumes and AI signals for every application.</p>{requestedJobId && <Link className="mt-4 inline-block" href={`/recruiter/jobs/${requestedJobId}`}><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Job details</Button></Link>}{selectedApplicant && <Card className="mt-5 border border-primary/30"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{selectedApplicant.candidateName}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedApplicant.resumeName} · Applied {new Date(selectedApplicant.appliedAt).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="accent">Talent {selectedApplicant.talentScore}</Badge><Badge variant="success">ATS {selectedApplicant.atsScore}</Badge>{selectedApplicant.skills.map((skill) => <Badge key={skill} variant="muted">{skill}</Badge>)}</div></div><Link href={requestedJobId ? `/recruiter/jobs/${requestedJobId}/applicants` : '/recruiter/applicants'}><Button variant="ghost" size="sm">Close profile</Button></Link></div></Card>}<div className="mt-5 space-y-4">{sortedApplications.length ? sortedApplications.map((application) => <ApplicantRankingCard key={application.id} application={application} job={getMappedJob(application.jobId)} updateApplication={updateApplication} ranking={rankings[application.id]} isLoadingRanking={!!loadingRankings[application.id]} error={rankingErrors[application.id]} />) : <Card className="text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No applicants yet</h2><p className="mt-2 text-sm text-muted-foreground">Applications submitted from the candidate jobs board will appear here.</p></Card>}</div></>}
    {requestedView === 'hackathons' && <HackathonsPipeline />}
    {requestedView === 'company' && <><Badge variant="success">Company profile</Badge><h1 className="mt-4 text-3xl font-bold">Your company</h1><p className="mt-2 text-slate-400">Keep this profile current for better candidate context.</p><Card className="mt-6"><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); sessionStorage.setItem('talentai_company', JSON.stringify(company)); }}><label className="text-sm text-slate-300">Company name<input required value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" /></label><label className="text-sm text-slate-300">Industry<input value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Technology" /></label><label className="text-sm text-slate-300">Location<input value={company.location} onChange={(e) => setCompany({ ...company, location: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Mumbai, India" /></label><label className="text-sm text-slate-300">Website<input type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="https://example.com" /></label><label className="text-sm text-slate-300 md:col-span-2">About the company<textarea rows={5} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Tell candidates about your mission and culture." /></label><div className="md:col-span-2"><Button type="submit"><Save size={16} /> Save profile</Button></div></form></Card></>}
  </section></div></main></div>;
}
