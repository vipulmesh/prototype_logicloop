'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BrainCircuit, CheckCircle2, MapPin, Loader2, PlayCircle, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { getApplications, getAvailableJobs, saveApplications } from '@/lib/demo-jobs';
import { getCachedAnalysis } from '@/lib/analysis-cache';
import { getCachedInterviewPrep, saveCachedInterviewPrep } from '@/lib/interview-cache';
import type { Job, JobApplication, InterviewPrep } from '@/types';

interface StoredResume {
  fileName: string | null;
  fingerprint: { fileName: string | null; fileSize: number | null; lastModified: number | null };
}

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<JobApplication['status'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Interview Prep State
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  useEffect(() => { 
    const found = getAvailableJobs().find((item) => item.id === params.id) || null; 
    setJob(found); 
    setApplicationStatus(getApplications().find((application) => application.jobId === params.id)?.status ?? null); 
  }, [params.id]);

  const apply = () => {
    if (!job) return;
    const resume = (() => { try { return JSON.parse(localStorage.getItem('talentai_resume') || sessionStorage.getItem('talentai_resume') || 'null') as StoredResume | null; } catch { return null; } })();
    const report = resume?.fingerprint ? getCachedAnalysis(resume.fingerprint)?.report : null;
    if (!resume?.fileName || !report) { setError('Analyze a resume first, then return to apply with one click.'); return; }
    if (getApplications().some((application) => application.jobId === job.id)) { setApplicationStatus(getApplications().find((application) => application.jobId === job.id)?.status ?? 'Pending'); return; }
    const application: JobApplication = { id: crypto.randomUUID(), jobId: job.id, jobTitle: job.title, candidateName: resume.fileName.replace(/\.[^.]+$/, ''), resumeName: resume.fileName, talentScore: report.overallScore, atsScore: report.atsScore, skills: report.technicalSkills, appliedAt: new Date().toISOString(), status: 'Pending', analysis: report };
    saveApplications([application, ...getApplications()]); setApplicationStatus(application.status); setError(null);
  };

  const startPractice = async (forceRegenerate = false) => {
    if (!job) return;
    const resume = (() => { try { return JSON.parse(localStorage.getItem('talentai_resume') || sessionStorage.getItem('talentai_resume') || 'null') as StoredResume | null; } catch { return null; } })();
    const report = resume?.fingerprint ? getCachedAnalysis(resume.fingerprint)?.report : null;
    if (!report) { setPrepError('Resume analysis not found.'); return; }

    const applicationId = getApplications().find((application) => application.jobId === job.id)?.id || null;

    if (!forceRegenerate) {
      const cached = getCachedInterviewPrep(applicationId, report, job);
      if (cached) {
        setPrep(cached);
        setShowPractice(true);
        return;
      }
    }

    setIsPrepLoading(true);
    setPrepError(null);
    setShowPractice(true);
    setRevealedHints({});

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, analysis: report })
      });
      const data = await res.json();
      if (!res.ok || !data.prep) throw new Error(data.error || 'Failed to generate interview prep.');
      
      saveCachedInterviewPrep(applicationId, report, job, data.prep);
      setPrep(data.prep);
    } catch (err) {
      setPrepError(err instanceof Error ? err.message : 'Error generating interview questions.');
      setShowPractice(false);
    } finally {
      setIsPrepLoading(false);
    }
  };

  const toggleHint = (index: number) => {
    setRevealedHints(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!job) return <div className="min-h-screen grid-bg"><main className="mx-auto max-w-xl px-6 py-28 text-center"><Card><h1 className="text-xl font-bold">Job not found</h1><Link className="mt-5 inline-flex" href="/jobs"><Button>Browse jobs</Button></Link></Card></main></div>;
  
  return (
    <div className="min-h-screen grid-bg">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">TalentAI</span>
        </Link>
        <div className="flex gap-2">
          <Link href="/pitch"><Button variant="ghost" size="sm">Pitch Analyzer</Button></Link>
          <Link href="/jobs"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> All jobs</Button></Link>
        </div>
      </nav>
      
      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-8">
        <Card>
          <div className="flex flex-col justify-between gap-5 md:flex-row">
            <div>
              <Badge variant="success">Open role</Badge>
              <h1 className="mt-4 text-3xl font-bold">{job.title}</h1>
              <p className="mt-2 text-lg text-primary">{job.company}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={14} />{job.location} · {job.type} · {job.salary}</p>
            </div>
            {applicationStatus ? (
              <div className="flex flex-col gap-3 items-end">
                <div className="self-start rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
                  <div className="flex items-center gap-2"><CheckCircle2 size={18} /> Applied</div>
                  <p className="mt-1 text-xs text-emerald-300/80">Application status: {applicationStatus}</p>
                </div>
                {!showPractice && (
                  <Button variant="outline" size="sm" onClick={() => startPractice(false)}>
                    <PlayCircle size={15} /> Practice Interview
                  </Button>
                )}
              </div>
            ) : (
              <Button size="lg" onClick={apply}>Apply with my resume</Button>
            )}
          </div>
          
          {!showPractice && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-lg font-semibold">About the role</h2>
              <p className="mt-3 leading-relaxed text-slate-400">{job.description}</p>
              <h2 className="mt-7 text-lg font-semibold">Key skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">{job.skills.map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}</div>
            </div>
          )}
          
          {error && <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-300">{error} <Link className="underline" href="/upload">Upload a resume</Link></p>}
          {prepError && <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle className="inline mr-2" size={16}/> {prepError}</p>}
        </Card>

        {showPractice && (
          <div className="mt-8">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BrainCircuit className="text-primary" /> AI Interview Practice
              </h2>
              <Button variant="ghost" size="sm" onClick={() => startPractice(true)} disabled={isPrepLoading}>
                <RefreshCw size={14} className={isPrepLoading ? "animate-spin" : ""} /> Regenerate
              </Button>
            </div>

            {isPrepLoading ? (
              <Card className="flex flex-col items-center justify-center min-h-64 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-semibold">Generating your personalized interview...</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">Gemini is analyzing your resume against the job description to prepare technical, behavioral, and HR questions.</p>
              </Card>
            ) : prep ? (
              <div className="space-y-6">
                <Card className="flex items-center gap-6 p-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Overall Readiness Score</h3>
                    <Progress value={prep.readinessScore} color={prep.readinessScore >= 80 ? "success" : prep.readinessScore >= 60 ? "accent" : "warning"} />
                    <p className="text-sm text-slate-400 mt-2">Based on how well your resume matches the job requirements.</p>
                  </div>
                </Card>
                
                {prep.questions.map((q, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex gap-2 items-center">
                        <Badge variant="accent" className="capitalize">{q.type}</Badge>
                        <Badge variant={q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Medium' ? 'warning' : 'default'}>{q.difficulty}</Badge>
                      </div>
                      <span className="text-sm text-slate-500 font-medium">Q{idx + 1}</span>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-white mb-6 leading-relaxed">{q.question}</h4>
                    
                    <div className="border-t border-border pt-4">
                      {revealedHints[idx] ? (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="text-sm font-semibold text-emerald-400">Expected Key Points</h5>
                            <Button variant="ghost" size="sm" onClick={() => toggleHint(idx)}>Hide Hints</Button>
                          </div>
                          <ul className="list-disc pl-4 space-y-2 text-sm text-slate-300">
                            {q.expectedKeyPoints.map((point, pIdx) => <li key={pIdx}>{point}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => toggleHint(idx)}>
                          <Eye size={15} /> View Expected Answer Hints
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
