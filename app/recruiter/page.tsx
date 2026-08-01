'use client';

import { FormEvent, Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, BarChart3, BrainCircuit, BriefcaseBusiness, Building2,
  Edit3, LogOut, Plus, Save, Trash2, Users, ChevronDown, ChevronUp,
  Download, Loader2, PlayCircle, RefreshCw, AlertCircle, ShieldAlert, ShieldCheck, Trophy, CheckCircle2, Sparkles, FolderGit2, Search, Target
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { getVerifiedSkillProfile } from '@/lib/skill-verification';
import { extractProjectsFromReport } from '@/lib/project-extraction';
import { generateFraudInsights } from '@/lib/fraud-detection';
import { ProjectCard } from '@/components/ProjectCard';
import { getApplications, getAvailableJobs, updateApplicationStatus } from '@/lib/demo-jobs';
import type { JobApplication, CandidateRanking, CandidateProject, Job, InterviewPrep } from '@/types';
import { getCachedCandidateRanking, saveCachedCandidateRanking } from '@/lib/candidate-ranking-cache';
import { getCachedInterviewPrep, saveCachedInterviewPrep } from '@/lib/interview-cache';
import { cn } from '@/lib/utils';
import { RecruiterMarketingNav } from '@/components/nav/recruiter-marketing-nav';

type PortalView = 'dashboard' | 'jobs' | 'company' | 'applicants' | 'hackathons' | 'directory' | 'analytics';

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

interface DiscoverySkill { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; confidence: number; }
interface DiscoveryCandidate {
  id: string; name: string; email: string | null; profilePhoto: string | null; registeredAt: string;
  resumeStatus: string; resumeName: string | null; talentScore: number | null; atsScore: number | null;
  verifiedSkills: { candidateLevel?: string; topStrongestSkills?: DiscoverySkill[] };
  extractedProjects: CandidateProject[]; technicalSkills: string[]; education: string; experience: string;
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



interface Hackathon { id: string; name: string; team: string; project: string; innovation: number; technical: number; business: number; overall: number; members: string[]; }

function HackathonsPipeline() {
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => { void fetch('/api/hackathons').then((response) => response.json()).then((data) => setHackathons(data.hackathons || [])).catch(() => undefined); }, []);

  return (
    <>
      <Badge variant="accent">Hackathon Sourcing</Badge>
      <h1 className="mt-4 text-3xl font-bold">Hackathon-to-Hiring Pipeline</h1>
      <p className="mt-2 text-slate-400">Discover and shortlist top talent directly from partner hackathons.</p>

      <div className="mt-8 space-y-6">
        {hackathons.map((h) => (
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
                {shortlisted[h.id] ? <><CheckCircle2 size={16} className="mr-2 text-success" /> Shortlisted</> : 'Shortlist Team'}
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

function HiringAnalyticsDashboard({ jobs, applications }: { jobs: RecruiterJob[], applications: JobApplication[] }) {
  const shortlisted = applications.filter(a => a.status === 'Shortlisted').length;
  const rejected = applications.filter(a => a.status === 'Rejected').length;
  const pending = applications.filter(a => a.status === 'Pending').length;
  const avgTalent = Math.round(applications.reduce((s, a) => s + (a.talentScore || 0), 0) / (applications.length || 1));
  const avgATS = Math.round(applications.reduce((s, a) => s + (a.atsScore || 0), 0) / (applications.length || 1));
  const allSkills = applications.flatMap(a => a.analysis?.technicalSkills || []);
  const skillMap = allSkills.reduce((m, s) => { m[s] = (m[s] || 0) + 1; return m; }, {} as Record<string, number>);
  const topSkills = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  const gapMap = applications.flatMap(a => a.analysis?.missingSkills || []).reduce((m, s) => { m[s] = (m[s] || 0) + 1; return m; }, {} as Record<string, number>);
  const topGaps = Object.entries(gapMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
  const best = [...applications].sort((a, b) => ((b.talentScore || 0) + (b.atsScore || 0)) - ((a.talentScore || 0) + (a.atsScore || 0)))[0];
  return (
    <div className="space-y-6">
      <div><Badge variant="default">Executive Dashboard</Badge><h1 className="mt-3 text-3xl font-bold">Hiring Analytics</h1><p className="mt-2 text-slate-400">Real-time hiring pipeline metrics powered by AI analysis.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[{label:'Total Applicants',val:applications.length,color:'border-l-primary'},{label:'Active Jobs',val:jobs.length,color:'border-l-accent'},{label:'Shortlisted',val:shortlisted,color:'border-l-emerald-500'},{label:'Pending Review',val:pending,color:'border-l-amber-500'}].map(m=><Card key={m.label} className={`p-4 border-l-4 ${m.color}`}><p className="text-xs text-slate-400 font-semibold uppercase">{m.label}</p><p className="mt-2 text-3xl font-bold">{m.val}</p></Card>)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5"><h3 className="text-base font-bold mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-primary"/>Pipeline Scores</h3><div className="space-y-4"><div><div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Avg Talent Score</span><span className="font-bold">{avgTalent}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-primary" style={{width:`${avgTalent}%`}}/></div></div><div><div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Avg ATS Score</span><span className="font-bold">{avgATS}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-emerald-500" style={{width:`${avgATS}%`}}/></div></div><div className="flex justify-between p-3 bg-black/20 rounded-xl border border-border text-sm mt-2"><span className="text-slate-400">Shortlist Rate</span><span className="font-bold">{applications.length?Math.round((shortlisted/applications.length)*100):0}%</span></div><div className="flex justify-between p-3 bg-black/20 rounded-xl border border-border text-sm"><span className="text-slate-400">Rejection Rate</span><span className="font-bold">{applications.length?Math.round((rejected/applications.length)*100):0}%</span></div></div></Card>
        <Card className="p-5"><h3 className="text-base font-bold mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-accent"/>AI Talent Insights</h3><div className="space-y-4"><div><p className="text-xs text-slate-400 font-semibold uppercase mb-2">Most In-demand Skills</p><div className="flex flex-wrap gap-1.5">{topSkills.length?topSkills.map(s=><Badge key={s} variant="success" className="text-[10px]">{s}</Badge>):<span className="text-xs text-slate-500">No data yet</span>}</div></div><div><p className="text-xs text-slate-400 font-semibold uppercase mb-2 flex items-center gap-1"><AlertCircle size={11}/>Primary Skill Gaps</p><div className="flex flex-wrap gap-1.5">{topGaps.length?topGaps.map(s=><Badge key={s} variant="warning" className="text-[10px]">{s}</Badge>):<span className="text-xs text-slate-500">No data yet</span>}</div></div>{best&&<div className="p-3 bg-primary/10 border border-primary/20 rounded-xl"><p className="text-xs text-primary font-bold mb-1">Top Recommended Candidate</p><p className="text-sm text-white font-medium">{best.candidateName}</p><p className="text-xs text-slate-400 mt-0.5">Applied for {best.jobTitle} · Talent {best.talentScore}</p></div>}</div></Card>
      </div>
    </div>
  );
}

function LegacyCandidateFullProfile({ application, onClose }: { application: JobApplication; onClose: () => void }) {
  const analysis = application.analysis;
  const prof = analysis ? getVerifiedSkillProfile(analysis) : null;
  const projs = analysis ? extractProjectsFromReport(analysis) : [];
  const fraud = analysis ? generateFraudInsights(analysis) : null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="default">Candidate Profile</Badge>
          <h1 className="mt-3 text-2xl font-bold">{application.candidateName}</h1>
          <p className="mt-1 text-sm text-slate-400">{application.resumeName} · Applied {new Date(application.appliedAt).toLocaleDateString()} · {application.jobTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="accent">Talent {application.talentScore}</Badge>
            <Badge variant="success">ATS {application.atsScore}</Badge>
            {application.status === 'Shortlisted' && <Badge variant="success">{application.status}</Badge>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => { const w = window.open('about:blank'); if(w) w.document.write(`<pre style="color:#fff;background:#111;padding:20px;font-family:sans-serif;">${application.resumeName}\n\nCandidate: ${application.candidateName}\nAnalysis cached. No re-upload required.</pre>`); }}>View Resume</Button>
          <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft size={14}/> Back</Button>
        </div>
      </div>

      {analysis && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5"><h3 className="text-base font-bold mb-3 flex items-center gap-2"><BrainCircuit className="text-primary" size={16}/>AI Recruiter Summary</h3><p className="text-sm text-slate-300 leading-relaxed">{analysis.recruiterSummary}</p><div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-white/10"><div className="h-2 rounded-full bg-emerald-500" style={{width:`${analysis.interviewReadiness}%`}}/></div><span className="text-sm font-bold text-emerald-400">{analysis.interviewReadiness}% Interview Ready</span></div></Card>

            {prof && <Card className="p-5"><div className="flex items-center gap-2 mb-4"><h3 className="text-base font-bold text-white flex items-center gap-2"><ShieldCheck className="text-primary" size={16}/>Verified Skills</h3><Badge variant="accent">{prof.candidateLevel}</Badge><Badge variant="success">{prof.overallConfidence}% confidence</Badge></div><div className="space-y-3">{prof.topStrongestSkills.map(s=><div key={s.name} className="flex items-center justify-between bg-black/20 p-2.5 rounded-lg border border-border"><div className="flex items-center gap-2"><Badge variant={s.level==='Advanced'?'success':s.level==='Intermediate'?'accent':'default'} className="text-xs w-24 justify-center">{s.level}</Badge><span className="text-sm font-medium">{s.name}</span></div><span className="text-xs text-emerald-400 font-bold">{s.confidence}%</span></div>)}</div></Card>}

            {projs.length > 0 && <Card className="p-5"><h3 className="text-base font-bold mb-4 flex items-center gap-2"><FolderGit2 className="text-primary" size={16}/>Extracted Projects ({projs.length})</h3><div className="space-y-4">{projs.map(p=><ProjectCard key={p.id} project={p} isRecruiterView/>)}</div></Card>}

            <Card className="p-5"><h3 className="text-base font-bold mb-3 flex items-center gap-2"><BriefcaseBusiness className="text-accent" size={16}/>Experience &amp; Education</h3><div className="space-y-3"><div className="bg-black/20 p-4 rounded-xl border border-border"><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Experience</p><p className="text-sm text-slate-300 leading-relaxed">{analysis.experienceSummary}</p></div><div className="bg-black/20 p-4 rounded-xl border border-border"><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Education</p><p className="text-sm text-slate-300 leading-relaxed">{analysis.educationSummary}</p></div></div></Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4"><h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Sparkles size={14} className="text-amber-400"/>Recommended Roles</h3><div className="flex flex-wrap gap-1.5">{analysis.recommendedRoles.map((r,i)=><Badge key={i} variant="accent" className="text-xs">{r}</Badge>)}</div></Card>

            <Card className="p-4"><h3 className="text-sm font-bold mb-3 text-white">All Technical Skills</h3><div className="flex flex-wrap gap-1.5">{analysis.technicalSkills.map(s=><Badge key={s} variant="muted" className="text-xs">{s}</Badge>)}</div></Card>

            {fraud && <Card className="p-4 border-amber-500/20"><h3 className="text-sm font-bold mb-3 text-amber-400 flex items-center gap-2"><ShieldAlert size={14}/>Fraud Detection</h3><div className="space-y-2 text-sm">{[['Trust Score',fraud.overallTrustScore+'%',fraud.overallTrustScore>=80],["Authenticity",fraud.authenticityScore+'%',fraud.authenticityScore>=80],['AI Gen Risk',fraud.aiGeneratedContentRisk+'%',fraud.aiGeneratedContentRisk<40],['Fake Resume',fraud.fakeResumeRisk+'%',fraud.fakeResumeRisk<40]].map(([label,val,ok])=><div key={String(label)} className="flex justify-between"><span className="text-slate-400">{String(label)}</span><span className={String(ok)==='true'?'text-emerald-400 font-bold':'text-amber-400 font-bold'}>{String(val)}</span></div>)}</div>{fraud.warnings.map((w,i)=><p key={i} className="mt-2 text-xs text-slate-400">⚠️ {w}</p>)}</Card>}
          </div>
        </div>
      )}
      {!analysis && <Card className="text-center p-8"><ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground mb-3"/><p className="text-slate-400">No AI analysis available for this candidate yet.</p></Card>}
    </div>
  );
}

function LegacyCandidateDirectory({ applications, rankings, onViewProfile }: { applications: JobApplication[], rankings: Record<string, CandidateRanking>, onViewProfile: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'talent'|'ats'|'match'|'recent'>('talent');
  const [minTalent, setMinTalent] = useState(0);
  const [shortlisted, setShortlisted] = useState<Record<string,boolean>>({});

  const filtered = applications.filter(a => {
    if (a.talentScore < minTalent) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const skills = [...(a.skills||[]), ...(a.analysis?.technicalSkills||[])].map(s=>s.toLowerCase());
    return (
      a.candidateName.toLowerCase().includes(q) ||
      a.jobTitle?.toLowerCase().includes(q) ||
      skills.some(s=>s.includes(q)) ||
      (a.analysis?.experienceSummary||'').toLowerCase().includes(q) ||
      (a.analysis?.educationSummary||'').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a,b)=>{
    if(sortBy==='talent') return (b.talentScore||0)-(a.talentScore||0);
    if(sortBy==='ats') return (b.atsScore||0)-(a.atsScore||0);
    if(sortBy==='match') return (rankings[b.id]?.matchScore||0)-(rankings[a.id]?.matchScore||0);
    return new Date(b.appliedAt).getTime()-new Date(a.appliedAt).getTime();
  });

  return (
    <div className="space-y-5">
      <div><Badge variant="accent">AI Candidate Discovery</Badge><h1 className="mt-3 text-3xl font-bold">Candidate Directory</h1><p className="mt-2 text-slate-400">Search, filter and discover top talent from the full applicant pool.</p></div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-2 bg-black/20 px-3 py-2.5 rounded-xl border border-border">
          <Search size={15} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, skills, tech, education, experience..." className="bg-transparent text-sm text-white outline-none w-full placeholder:text-slate-500"/>
          {search&&<button onClick={()=>setSearch('')} className="text-slate-400 hover:text-white text-xs">Clear</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="bg-black/30 border border-border text-sm text-white rounded-xl px-3 py-2 outline-none">
          <option value="talent">Sort: Talent Score</option>
          <option value="ats">Sort: ATS Score</option>
          <option value="match">Sort: Match Score</option>
          <option value="recent">Sort: Recently Active</option>
        </select>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-2.5 rounded-xl border border-border text-sm text-slate-300">
          <span className="shrink-0">Min Talent</span>
          <input type="range" min={0} max={100} value={minTalent} onChange={e=>setMinTalent(Number(e.target.value))} className="w-24"/>
          <span className="font-bold w-6">{minTalent}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">{sorted.length} candidate{sorted.length!==1?'s':''} found</p>
      {sorted.length===0 && <Card className="text-center p-8"><Users className="mx-auto h-8 w-8 text-muted-foreground mb-3"/><p className="text-slate-400">No candidates match your search.</p></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map(app=>{
          const prof = app.analysis ? getVerifiedSkillProfile(app.analysis) : null;
          const projs = app.analysis ? extractProjectsFromReport(app.analysis) : [];
          const match = rankings[app.id]?.matchScore;
          const sl = shortlisted[app.id];
          return (
            <Card key={app.id} className="p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white leading-tight">{app.candidateName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{app.jobTitle}</p>
                </div>
                <button onClick={()=>setShortlisted(p=>({...p,[app.id]:!sl}))} className={`shrink-0 text-xs px-2 py-1 rounded-lg border transition ${sl?'bg-emerald-500/20 border-emerald-500/30 text-emerald-400':'border-border text-slate-400 hover:text-white'}`}>{sl?<><CheckCircle2 size={11} className="inline mr-1"/>Saved</>:'Shortlist'}</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="accent" className="text-xs">Talent {app.talentScore}</Badge>
                <Badge variant="success" className="text-xs">ATS {app.atsScore}</Badge>
                {match!=null&&<Badge variant="muted" className="text-xs">Match {match}%</Badge>}
                {prof&&<Badge variant="default" className="text-xs">{prof.candidateLevel}</Badge>}
              </div>
              {prof&&prof.topStrongestSkills.length>0&&<div><p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Top Skills</p><div className="flex flex-wrap gap-1">{prof.topStrongestSkills.slice(0,4).map(s=><Badge key={s.name} variant="success" className="text-[10px] px-1.5">{s.name}</Badge>)}</div></div>}
              {projs.length>0&&<div><p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Projects</p><div className="flex flex-wrap gap-1">{projs.slice(0,2).map(p=><Badge key={p.id} variant="muted" className="text-[10px] px-1.5">{p.title}</Badge>)}</div></div>}
              {app.analysis?.recommendedRoles?.length>0&&<div><p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Recommended Roles</p><div className="flex flex-wrap gap-1">{app.analysis.recommendedRoles.slice(0,2).map((r,i)=><Badge key={i} variant="accent" className="text-[10px] px-1.5">{r}</Badge>)}</div></div>}
              <Button size="sm" variant="outline" className="mt-auto w-full" onClick={()=>onViewProfile(app.id)}>View Full Profile</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CandidateFullProfile({ candidateId, onClose }: { candidateId: string; onClose: () => void }) {
  const [candidate, setCandidate] = useState<(DiscoveryCandidate & { resumes: Array<{ id: string; fileName: string; createdAt: string; status: string; talentScore: number | null; atsScore: number | null; report: Record<string, unknown>; verifiedSkills: { candidateLevel?: string; topStrongestSkills?: DiscoverySkill[] }; extractedProjects: CandidateProject[] }> }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setCandidate(null); setError('');
    fetch(`/api/candidates/${candidateId}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load candidate.');
      if (active) setCandidate(data.candidate);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load candidate.'); });
    return () => { active = false; };
  }, [candidateId]);

  if (error) return <Card className="text-center p-8"><ShieldAlert className="mx-auto h-8 w-8 text-amber-400 mb-3" /><p className="text-slate-300">{error}</p><Button variant="ghost" size="sm" className="mt-4" onClick={onClose}><ArrowLeft size={14} /> Back</Button></Card>;
  if (!candidate) return <Card className="flex items-center justify-center gap-3 p-10 text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-primary" />Loading candidate profile…</Card>;
  const resume = candidate.resumes[0];
  const skills = resume?.verifiedSkills?.topStrongestSkills || [];
  const projects = resume?.extractedProjects || [];
  const report = resume?.report || {};
  return <div className="space-y-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary">{candidate.profilePhoto ? <img src={candidate.profilePhoto} alt="" className="h-full w-full object-cover" /> : candidate.name.slice(0, 2).toUpperCase()}</div><div><Badge variant="default">Candidate Profile</Badge><h1 className="mt-2 text-2xl font-bold">{candidate.name}</h1><p className="mt-1 text-sm text-slate-400">{candidate.email || 'Email not available'} · Registered {new Date(candidate.registeredAt).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="accent">Talent {resume?.talentScore ?? '—'}</Badge><Badge variant="success">ATS {resume?.atsScore ?? '—'}</Badge><Badge variant="muted">{resume?.status || 'Not uploaded'}</Badge></div></div></div><Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft size={14} /> Back</Button></div><div className="grid gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2"><Card className="p-5"><h3 className="text-base font-bold">Experience &amp; Education</h3><div className="mt-4 space-y-3"><div className="rounded-xl border border-border bg-black/20 p-4"><p className="text-xs font-semibold uppercase text-slate-400">Experience</p><p className="mt-1 text-sm leading-relaxed text-slate-300">{typeof report.experienceSummary === 'string' && report.experienceSummary || 'Not available'}</p></div><div className="rounded-xl border border-border bg-black/20 p-4"><p className="text-xs font-semibold uppercase text-slate-400">Education</p><p className="mt-1 text-sm leading-relaxed text-slate-300">{typeof report.educationSummary === 'string' && report.educationSummary || 'Not available'}</p></div></div></Card>{projects.length > 0 && <Card className="p-5"><h3 className="flex items-center gap-2 text-base font-bold"><FolderGit2 className="text-primary" size={16} />Extracted Projects ({projects.length})</h3><div className="mt-4 space-y-4">{projects.map((project) => <ProjectCard key={project.id} project={project} isRecruiterView />)}</div></Card>}</div><div className="space-y-4"><Card className="p-4"><h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="text-primary" size={15} />Verified Skills</h3><Badge variant="accent" className="mt-3">{resume?.verifiedSkills?.candidateLevel || 'Unrated'}</Badge><div className="mt-3 flex flex-wrap gap-1.5">{skills.length ? skills.map((skill) => <Badge key={skill.name} variant="success" className="text-xs">{skill.name} · {skill.level}</Badge>) : <span className="text-sm text-slate-500">No verified skills yet.</span>}</div></Card><Card className="p-4"><p className="text-xs font-semibold uppercase text-slate-400">Resume</p><p className="mt-2 text-sm text-slate-300">{resume?.fileName || 'No resume uploaded'}</p></Card></div></div></div>;
}

function CandidateDirectory({ candidates, loading, error, onViewProfile }: { candidates: DiscoveryCandidate[]; loading: boolean; error: string; onViewProfile: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'talent' | 'ats' | 'recent'>('talent');
  const [minTalent, setMinTalent] = useState(0);
  const [minAts, setMinAts] = useState(0);
  const [skillLevel, setSkillLevel] = useState('all');
  const filtered = candidates.filter((candidate) => {
    if ((candidate.talentScore ?? 0) < minTalent || (candidate.atsScore ?? 0) < minAts) return false;
    const skills = candidate.verifiedSkills.topStrongestSkills || [];
    if (skillLevel !== 'all' && !skills.some((skill) => skill.level === skillLevel)) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const technologies = candidate.extractedProjects.flatMap((project) => project.technologies || []);
    return candidate.name.toLowerCase().includes(query) || candidate.technicalSkills.some((skill) => skill.toLowerCase().includes(query)) || skills.some((skill) => skill.name.toLowerCase().includes(query)) || technologies.some((technology) => technology.toLowerCase().includes(query));
  }).sort((a, b) => sortBy === 'talent' ? (b.talentScore ?? -1) - (a.talentScore ?? -1) : sortBy === 'ats' ? (b.atsScore ?? -1) - (a.atsScore ?? -1) : new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  return <div className="space-y-5"><div><Badge variant="accent">AI Candidate Discovery</Badge><h1 className="mt-3 text-3xl font-bold">Candidate Directory</h1><p className="mt-2 text-slate-400">Search, filter and discover candidates from your TalentAI database.</p></div><div className="flex flex-col gap-3 md:flex-row"><div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2.5"><Search size={15} className="shrink-0 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, skills, or technologies..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />{search && <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-white">Clear</button>}</div><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-xl border border-border bg-black/30 px-3 py-2 text-sm text-white outline-none"><option value="talent">Highest Talent Score</option><option value="ats">Highest ATS Score</option><option value="recent">Recently Registered</option></select></div><div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-slate-300">Talent ≥ <input type="range" min="0" max="100" value={minTalent} onChange={(event) => setMinTalent(Number(event.target.value))} className="w-20" /><b>{minTalent}</b></label><label className="flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-slate-300">ATS ≥ <input type="range" min="0" max="100" value={minAts} onChange={(event) => setMinAts(Number(event.target.value))} className="w-20" /><b>{minAts}</b></label><select value={skillLevel} onChange={(event) => setSkillLevel(event.target.value)} className="rounded-xl border border-border bg-black/30 px-3 py-2 text-sm text-white outline-none"><option value="all">All skill levels</option><option value="Advanced">Advanced</option><option value="Intermediate">Intermediate</option><option value="Beginner">Beginner</option></select></div>{loading && <Card className="flex items-center justify-center gap-3 p-8 text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-primary" />Loading candidates…</Card>}{error && <Card className="p-8 text-center"><ShieldAlert className="mx-auto mb-3 h-8 w-8 text-amber-400" /><p className="text-slate-300">{error}</p></Card>}{!loading && !error && <><p className="text-xs text-slate-500">{filtered.length} candidate{filtered.length === 1 ? '' : 's'} found</p>{filtered.length === 0 && <Card className="p-8 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-slate-400">No candidates match your search.</p></Card>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((candidate) => { const skills = candidate.verifiedSkills.topStrongestSkills || []; return <Card key={candidate.id} className="flex flex-col gap-3 p-4 transition-colors hover:border-primary/40"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold text-primary">{candidate.profilePhoto ? <img src={candidate.profilePhoto} alt="" className="h-full w-full object-cover" /> : candidate.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><h3 className="truncate font-semibold leading-tight text-white">{candidate.name}</h3><p className="mt-0.5 truncate text-xs text-slate-400">{candidate.email || 'Email not available'}</p></div></div><div className="flex flex-wrap gap-1.5"><Badge variant="accent" className="text-xs">Talent {candidate.talentScore ?? '—'}</Badge><Badge variant="success" className="text-xs">ATS {candidate.atsScore ?? '—'}</Badge><Badge variant="muted" className="text-xs">{candidate.resumeStatus}</Badge>{candidate.verifiedSkills.candidateLevel && <Badge variant="default" className="text-xs">{candidate.verifiedSkills.candidateLevel}</Badge>}</div>{skills.length > 0 && <div><p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Verified Skills</p><div className="flex flex-wrap gap-1">{skills.slice(0, 4).map((skill) => <Badge key={skill.name} variant="success" className="px-1.5 text-[10px]">{skill.name}</Badge>)}</div></div>}{candidate.extractedProjects.length > 0 && <div><p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Projects</p><div className="flex flex-wrap gap-1">{candidate.extractedProjects.slice(0, 2).map((project) => <Badge key={project.id} variant="muted" className="px-1.5 text-[10px]">{project.title}</Badge>)}</div></div>}<Button size="sm" variant="outline" className="mt-auto w-full" onClick={() => onViewProfile(candidate.id)}>View Full Profile</Button></Card>; })}</div></>}</div>;
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
  const fraud = application.analysis ? generateFraudInsights(application.analysis) : null;

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
            {fraud && fraud.overallTrustScore < 80 && <Badge variant="warning"><ShieldAlert size={12} className="mr-1" /> Low Trust</Badge>}
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

          {/* Verified Skill Profile */}
          {application.analysis && (() => {
            const skillProfile = getVerifiedSkillProfile(application.analysis);
            return (
              <div className="mt-6 border-t border-border/50 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="text-primary" size={16} /> Verified Skill Profile ({skillProfile.candidateLevel} Level)
                  </h4>
                  <Badge variant="success">Skill Confidence {skillProfile.overallConfidence}%</Badge>
                </div>

                {/* Top 5 Strongest Skills */}
                {skillProfile.topStrongestSkills.length ? (
                  <div className="mb-3">
                    <span className="text-xs text-slate-400 block mb-1.5 font-medium">Top 5 Strongest Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillProfile.topStrongestSkills.map((s) => (
                        <Badge key={s.name} variant="success" className="text-xs">
                          {s.name} ({s.confidence}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5 font-medium">Verified Technical Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillProfile.verifiedTechnicalSkills.map((s) => (
                        <Badge key={s.name} variant={s.level === 'Advanced' ? 'success' : s.level === 'Intermediate' ? 'accent' : 'default'} className="text-xs">
                          {s.name} · {s.level} ({s.confidence}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5 font-medium">Verified Soft Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillProfile.verifiedSoftSkills.map((s) => (
                        <Badge key={s.name} variant={s.level === 'Advanced' ? 'success' : s.level === 'Intermediate' ? 'accent' : 'default'} className="text-xs">
                          {s.name} · {s.level} ({s.confidence}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted Projects Portfolio */}
                {(() => {
                  const candidateProjects = extractProjectsFromReport(application.analysis);
                  if (!candidateProjects.length) return null;
                  return (
                    <div className="mt-6 border-t border-border/50 pt-4">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <FolderGit2 className="text-primary" size={16} /> Extracted Projects ({candidateProjects.length})
                      </h4>
                      <div className="space-y-3">
                        {candidateProjects.map((proj) => (
                          <ProjectCard key={proj.id} project={proj} isRecruiterView />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          <div className="mt-6 flex items-center justify-between bg-black/20 p-4 rounded-xl border border-border">
            <span className="text-sm font-medium">Interview Readiness</span>
            <Badge variant={ranking.interviewReadiness >= 70 ? 'success' : ranking.interviewReadiness >= 50 ? 'accent' : 'warning'}>
              {ranking.interviewReadiness}/100
            </Badge>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <h3 className="text-md font-semibold text-amber-400 mb-4 flex items-center gap-2"><ShieldAlert size={18} /> Fraud &amp; Risk Analysis</h3>
            {fraud ? (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl border border-border">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Trust Score</p>
                    <p className={cn("text-2xl font-bold", fraud.overallTrustScore < 80 ? "text-amber-400" : "text-emerald-400")}>{fraud.overallTrustScore}%</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-border">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Authenticity</p>
                    <p className={cn("text-2xl font-bold", fraud.authenticityScore < 80 ? "text-amber-400" : "text-emerald-400")}>{fraud.authenticityScore}%</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-border">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">AI Gen Risk</p>
                    <p className={cn("text-2xl font-bold", fraud.aiGeneratedContentRisk > 40 ? "text-amber-400" : "text-emerald-400")}>{fraud.aiGeneratedContentRisk}%</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Badge variant={fraud.duplicateProfileRisk > 50 ? "warning" : "success"}>Duplicate: {fraud.duplicateProfileRisk > 50 ? 'High' : 'Low'}</Badge>
                  <Badge variant={fraud.fakeResumeRisk > 40 ? "warning" : "success"}>Fake Resume: {fraud.fakeResumeRisk}%</Badge>
                  <Badge variant={fraud.missingInformationRisk > 50 ? "warning" : "success"}>Missing Info: {fraud.missingInformationRisk}%</Badge>
                </div>
              </>
            ) : <p className="text-xs text-slate-400">No analysis data — upload a resume to enable fraud detection.</p>}
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

export default function RecruiterPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" /> }>
      <RecruiterPortal />
    </Suspense>
  );
}

function RecruiterPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const requestedView: PortalView = viewParam === 'jobs' || viewParam === 'company' || viewParam === 'applicants' || viewParam === 'hackathons' || viewParam === 'directory' ? viewParam : 'dashboard';
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
  const [techSearch, setTechSearch] = useState('');
  const [directoryProfileId, setDirectoryProfileId] = useState<string|null>(null);
  const [directoryCandidates, setDirectoryCandidates] = useState<DiscoveryCandidate[]>([]);
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState('');
  const rankingTracker = useRef(new Set<string>());

  useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('talentai_session='))
      ?.split('=')[1];

    if (cookieValue) {
      try {
        const session = JSON.parse(decodeURIComponent(cookieValue)) as { name?: string };
        setRecruiterName(session.name || '');
      } catch {
        setRecruiterName('');
      }
    } else {
      setRecruiterName('');
    }

    setCompany(readSession('talentai_company', defaultCompany));
    void Promise.all([getAvailableJobs(), getApplications()]).then(([availableJobs, savedApplications]) => {
      setJobs(availableJobs.map((job) => ({ ...job, skills: job.skills.join(','), createdAt: new Date().toISOString() })));
      setApplications(savedApplications);
    });
    setIsReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (requestedView !== 'directory') return;
    let active = true;
    setIsDirectoryLoading(true);
    setDirectoryError('');
    fetch('/api/candidates').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load candidates.');
      if (active) setDirectoryCandidates(data.candidates || []);
    }).catch((reason: unknown) => {
      if (active) setDirectoryError(reason instanceof Error ? reason.message : 'Unable to load candidates.');
    }).finally(() => { if (active) setIsDirectoryLoading(false); });
    return () => { active = false; };
  }, [requestedView]);

  const saveJob = async (job: Omit<RecruiterJob, 'id' | 'createdAt'>) => {
    const response = await fetch(requestedEditId ? `/api/jobs/${requestedEditId}` : '/api/jobs', { method: requestedEditId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...job, company: company.name }) });
    if (response.ok) {
      const saved = (await response.json()).job as Job;
      const mapped = { ...saved, skills: saved.skills.join(','), createdAt: new Date().toISOString() };
      setJobs((current) => requestedEditId ? current.map((item) => item.id === mapped.id ? mapped : item) : [mapped, ...current]);
    }
    router.push('/recruiter/jobs');
  };
  const deleteJob = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs((current) => current.filter((job) => job.id !== id));
    router.push('/recruiter/jobs');
  };
  const updateApplication = async (id: string, status: JobApplication['status']) => {
    const application = await updateApplicationStatus(id, status);
    setApplications((current) => current.map((item) => item.id === id ? application : item));
  };
  const login = async (event: FormEvent) => {
    event.preventDefault();
    const email = loginName.trim();
    if (!email) return;

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'demo123', role: 'RECRUITER' }),
    });

    if (response.ok) {
      const data = (await response.json()) as { user?: { name?: string } };
      const name = data.user?.name ?? email;
      setRecruiterName(name);
      router.push('/recruiter?view=dashboard');
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    alert(data.error ?? 'Unable to sign in.');
  };
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setRecruiterName('');
    router.push('/recruiter/login');
  };
  const editJob = jobs.find((job) => job.id === requestedEditId) ?? null;
  const detailJob = jobs.find((job) => job.id === requestedJobId) ?? null;
  const filteredApplications = applications.filter((application) => {
    const matchesJob = !requestedJobId || application.jobId === requestedJobId;
    if (!matchesJob) return false;
    if (!techSearch.trim()) return true;

    const term = techSearch.toLowerCase().trim();
    const candidateSkills = (application.skills || []).map((s) => s.toLowerCase());
    const analysisSkills = (application.analysis?.technicalSkills || []).map((s) => s.toLowerCase());

    const projects = extractProjectsFromReport(application.analysis);
    const projectTechs = projects.flatMap((p) => p.technologies.map((t) => t.toLowerCase()));
    const projectTitles = projects.map((p) => p.title.toLowerCase());

    return (
      candidateSkills.some((s) => s.includes(term)) ||
      analysisSkills.some((s) => s.includes(term)) ||
      projectTechs.some((t) => t.includes(term)) ||
      projectTitles.some((t) => t.includes(term)) ||
      application.candidateName.toLowerCase().includes(term)
    );
  });
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
  if (!recruiterName) return <div className="min-h-screen overflow-hidden bg-background"><div className="relative grid-bg"><div className="orb right-0 top-8 h-96 w-96 bg-accent" /><RecruiterMarketingNav /><main className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-6 md:pb-28 md:pt-24"><div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]"><div><Badge variant="accent" className="px-3 py-1">Recruiter workspace</Badge><h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">Build a hiring process with <span className="text-gradient">better context.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">TalentAI brings job management, applicant review, and AI-assisted talent signals into one focused workspace for your team.</p><div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" />Manage open roles</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" />Review candidates</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" />Prioritize matches</span></div></div><Card className="p-6 sm:p-8"><Badge variant="accent">Recruiter access</Badge><h2 className="mt-4 text-2xl font-bold text-white">Log in or register</h2><p className="mt-2 text-sm leading-6 text-slate-400">Enter your name to open your recruiter workspace.</p><form className="mt-6" onSubmit={login}><label className="text-sm text-slate-300">Your name<input required value={loginName} onChange={(e) => setLoginName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Alex Morgan" /></label><Button className="mt-5 w-full" type="submit">Continue to recruiter portal</Button></form></Card></div></main></div><section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-24"><div className="max-w-2xl"><p className="text-sm font-semibold text-accent">Designed for hiring teams</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">A clearer view of every candidate.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[{ icon: BriefcaseBusiness, title: 'Manage open roles', text: 'Create and maintain job listings from a single workspace.' }, { icon: Users, title: 'Review candidate context', text: 'Explore applicants, their profiles, and the projects behind their experience.' }, { icon: BarChart3, title: 'Prioritize with AI signals', text: 'Use rankings and skill insights to focus on the strongest matches.' }].map((feature) => <Card key={feature.title} hover className="p-6"><feature.icon className="text-accent" size={22} /><h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p></Card>)}</div></section></div>;

  const navigation: { id: PortalView; label: string; href: string; icon: typeof BarChart3 }[] = [
    { id: 'dashboard', label: 'Analytics', href: '/recruiter/dashboard', icon: BarChart3 },
    { id: 'directory', label: 'Candidate Discovery', href: '/recruiter/directory', icon: Users },
    { id: 'jobs', label: 'My jobs', href: '/recruiter/jobs', icon: BriefcaseBusiness },
    { id: 'applicants', label: 'Applicants', href: '/recruiter/applicants', icon: CheckCircle2 },
    { id: 'hackathons', label: 'Hackathons', href: '/recruiter/hackathons', icon: Trophy },
    { id: 'company', label: 'Company profile', href: '/recruiter/company', icon: Building2 },
  ];

  return <div className="min-h-screen grid-bg"><nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><BrainCircuit className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">TalentAI</span></Link><Button variant="ghost" size="sm" onClick={logout}><LogOut size={15} /> Log out</Button></nav><main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-6"><div className="flex flex-col gap-6 lg:flex-row"><aside className="lg:w-56"><Card className="p-3"><p className="px-3 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{recruiterName}</p>{navigation.map((item) => <Link key={item.id} href={item.href} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${requestedView === item.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={17} />{item.label}</Link>)}</Card></aside><section className="min-w-0 flex-1">
    {requestedView === 'dashboard' && <HiringAnalyticsDashboard jobs={jobs} applications={applications}/>}
    {requestedView === 'jobs' && detailJob && <><Link href="/recruiter/jobs"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> My jobs</Button></Link><Card className="mt-6"><div className="flex flex-col justify-between gap-5 md:flex-row"><div><Badge variant="success">Open role</Badge><h1 className="mt-4 text-3xl font-bold">{detailJob.title}</h1><p className="mt-2 text-sm text-muted-foreground">{detailJob.location} · {detailJob.type} · Posted {new Date(detailJob.createdAt).toLocaleDateString()}</p></div><div className="flex h-fit flex-wrap gap-2"><Link href={`/recruiter/jobs/${detailJob.id}/edit`}><Button variant="ghost" size="sm"><Edit3 size={14} /> Edit</Button></Link><Link href={`/recruiter/jobs/${detailJob.id}/applicants`}><Button size="sm"><Users size={14} /> View applicants</Button></Link></div></div><div className="mt-8 border-t border-border pt-6"><h2 className="text-lg font-semibold">About the role</h2><p className="mt-3 leading-relaxed text-slate-400">{detailJob.description}</p><h2 className="mt-7 text-lg font-semibold">Key skills</h2><div className="mt-3 flex flex-wrap gap-2">{detailJob.skills.split(',').filter(Boolean).map((skill) => <Badge key={skill} variant="muted">{skill.trim()}</Badge>)}</div></div></Card></>}
    {requestedView === 'jobs' && !detailJob && <><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge variant="accent">Job management</Badge><h1 className="mt-4 text-3xl font-bold">Posted jobs</h1><p className="mt-2 text-slate-400">Create and manage roles for your hiring team.</p></div><Link href="/recruiter/jobs/new"><Button><Plus size={16} /> Create job</Button></Link></div>{(searchParams.get('create') === 'true' || requestedEditId) && <div className="mt-6"><JobForm job={editJob} onSave={saveJob} onCancel={() => router.push('/recruiter/jobs')} /></div>}<div className="mt-6 space-y-4">{jobs.length ? jobs.map((job) => <Card key={job.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><Link href={`/recruiter/jobs/${job.id}`}><h2 className="text-lg font-semibold hover:text-primary">{job.title}</h2></Link><Badge variant="success">Open</Badge></div><p className="mt-1 text-sm text-muted-foreground">{job.location} · {job.type}</p><p className="mt-3 text-sm leading-relaxed text-slate-400">{job.description}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.split(',').filter(Boolean).map((skill) => <Badge key={skill} variant="muted">{skill.trim()}</Badge>)}</div></div><div className="flex h-fit flex-wrap gap-2"><Link href={`/recruiter/jobs/${job.id}/applicants`}><Button variant="ghost" size="sm"><Users size={14} /> Applicants</Button></Link><Link href={`/recruiter/jobs/${job.id}/edit`}><Button variant="ghost" size="sm"><Edit3 size={14} /> Edit</Button></Link><Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)}><Trash2 size={14} /> Delete</Button></div></div></Card>) : <Card className="text-center"><BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No jobs posted</h2><p className="mt-2 text-sm text-muted-foreground">Create your first role to start building a candidate pipeline.</p></Card>}</div></>}
    {requestedView === 'directory' && (directoryProfileId ? <CandidateFullProfile candidateId={directoryProfileId} onClose={()=>setDirectoryProfileId(null)} /> : <CandidateDirectory candidates={directoryCandidates} loading={isDirectoryLoading} error={directoryError} onViewProfile={setDirectoryProfileId} />)}
    {requestedView === 'applicants' && <><Badge variant="default">Candidate pipeline</Badge><h1 className="mt-4 text-3xl font-bold">{requestedJobId ? detailJob?.title || 'Job applicants' : 'Applicants'}</h1><p className="mt-2 text-slate-400">Review resumes, extracted projects, and AI candidate rankings.</p><div className="mt-4 flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-border max-w-xl"><Search size={16} className="text-slate-400 ml-1" /><input value={techSearch} onChange={(e) => setTechSearch(e.target.value)} placeholder="Search candidates by project technology (e.g. React, Python, Docker)..." className="bg-transparent text-sm text-white outline-none w-full placeholder:text-slate-500" />{techSearch && <Button variant="ghost" size="sm" onClick={() => setTechSearch('')}>Clear</Button>}</div>{requestedJobId && <Link className="mt-4 inline-block" href={`/recruiter/jobs/${requestedJobId}`}><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Job details</Button></Link>}{selectedApplicant && <Card className="mt-5 border border-primary/30"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{selectedApplicant.candidateName}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedApplicant.resumeName} · Applied {new Date(selectedApplicant.appliedAt).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="accent">Talent {selectedApplicant.talentScore}</Badge><Badge variant="success">ATS {selectedApplicant.atsScore}</Badge>{selectedApplicant.skills.map((skill) => <Badge key={skill} variant="muted">{skill}</Badge>)}</div>{selectedApplicant.analysis && (() => { const prof = getVerifiedSkillProfile(selectedApplicant.analysis); const projs = extractProjectsFromReport(selectedApplicant.analysis); return <div className="mt-4 border-t border-border pt-3 space-y-3"><div className="flex items-center gap-2"><h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="text-primary" size={14} /> Verified Skill Profile ({prof.candidateLevel} Level)</h4><Badge variant="success" className="text-[10px]">Confidence {prof.overallConfidence}%</Badge></div><div className="flex flex-wrap gap-1.5">{prof.topStrongestSkills.map(s => <Badge key={s.name} variant="success" className="text-xs">{s.name} ({s.level} · {s.confidence}%)</Badge>)}</div><div className="pt-2"><h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1"><FolderGit2 className="text-primary" size={14} /> Extracted Projects ({projs.length})</h4><div className="space-y-2">{projs.map(p => <ProjectCard key={p.id} project={p} isRecruiterView />)}</div></div></div>; })()}</div><Link href={requestedJobId ? `/recruiter/jobs/${requestedJobId}/applicants` : '/recruiter/applicants'}><Button variant="ghost" size="sm">Close profile</Button></Link></div></Card>}<div className="mt-5 space-y-4">{sortedApplications.length ? sortedApplications.map((application) => <ApplicantRankingCard key={application.id} application={application} job={getMappedJob(application.jobId)} updateApplication={updateApplication} ranking={rankings[application.id]} isLoadingRanking={!!loadingRankings[application.id]} error={rankingErrors[application.id]} />) : <Card className="text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No matching applicants</h2><p className="mt-2 text-sm text-muted-foreground">Try adjusting your technology search term or selection filter.</p></Card>}</div></>}
    {requestedView === 'hackathons' && <HackathonsPipeline />}
    {requestedView === 'company' && <><Badge variant="success">Company profile</Badge><h1 className="mt-4 text-3xl font-bold">Your company</h1><p className="mt-2 text-slate-400">Keep this profile current for better candidate context.</p><Card className="mt-6"><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); sessionStorage.setItem('talentai_company', JSON.stringify(company)); }}><label className="text-sm text-slate-300">Company name<input required value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" /></label><label className="text-sm text-slate-300">Industry<input value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Technology" /></label><label className="text-sm text-slate-300">Location<input value={company.location} onChange={(e) => setCompany({ ...company, location: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Mumbai, India" /></label><label className="text-sm text-slate-300">Website<input type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="https://example.com" /></label><label className="text-sm text-slate-300 md:col-span-2">About the company<textarea rows={5} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-border bg-black/20 px-3 py-2.5 text-white outline-none focus:border-primary" placeholder="Tell candidates about your mission and culture." /></label><div className="md:col-span-2"><Button type="submit"><Save size={16} /> Save profile</Button></div></form></Card></>}
  </section></div></main></div>;
}
