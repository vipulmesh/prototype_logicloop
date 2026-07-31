'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Sparkles,
  Target,
} from 'lucide-react';
import { Badge, Button, Card, Progress, ScoreCircle } from '@/components/ui';
import { consumeResumeAnalysisRequest, getCachedAnalysis, saveCachedAnalysis } from '@/lib/analysis-cache';
import type { TalentReport } from '@/types';

interface StoredResume {
  text: string;
  fileName: string | null;
}

function ReportList({ items, empty = 'No signals found.' }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <ul className="space-y-2 text-sm text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2 leading-relaxed">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function SkillBadges({ skills, variant = 'default' }: { skills: string[]; variant?: 'default' | 'accent' | 'success' | 'warning' | 'muted' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.length ? skills.map((skill) => <Badge key={skill} variant={variant}>{skill}</Badge>) : (
        <p className="text-sm text-muted-foreground">No skills identified.</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [report, setReport] = useState<TalentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  const analyzeResume = async (storedResume: StoredResume) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: storedResume.text }),
      });
      const data: unknown = await response.json();

      if (!response.ok || !data || typeof data !== 'object' || !('report' in data)) {
        const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Unable to analyze this resume. Please try again.';
        throw new Error(message);
      }

      const talentReport = data.report as TalentReport;
      const cached = saveCachedAnalysis(talentReport);
      setReport(cached.report);
      setLastAnalyzed(cached.analyzedAt);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Unable to analyze this resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedResume = sessionStorage.getItem('talentai_resume');
    if (!savedResume) {
      setError('Upload a resume before requesting an analysis.');
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(savedResume) as StoredResume;
      if (!parsed.text || typeof parsed.text !== 'string') throw new Error();
      setResume(parsed);
      const cached = getCachedAnalysis();
      if (cached) {
        setReport(cached.report);
        setLastAnalyzed(cached.analyzedAt);
        setIsLoading(false);
      } else if (consumeResumeAnalysisRequest()) {
        void analyzeResume(parsed);
      } else {
        setError('This resume has not been analyzed yet. Upload it again to start analysis.');
        setIsLoading(false);
      }
    } catch {
      setError('The uploaded resume could not be read. Please upload it again.');
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen grid-bg">
      <div className="orb h-80 w-80 bg-primary left-1/3 top-10" />
      <div className="orb h-64 w-64 bg-accent right-1/4 bottom-20" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TalentAI</span>
        </Link>
        <div className="flex gap-2"><Link href="/jobs"><Button variant="ghost" size="sm">Browse jobs</Button></Link><Link href="/upload"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> New resume</Button></Link></div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8">
        <Badge variant="default" className="px-4 py-1.5"><Sparkles size={13} className="mr-1.5" />AI Talent Report</Badge>
        <h1 className="mt-5 text-3xl font-bold md:text-4xl">Your resume intelligence report</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-slate-400"><p>{resume?.fileName || 'Resume'} · Gemini-powered recruiter and ATS analysis</p>{lastAnalyzed && <span className="text-xs text-muted-foreground">Last analyzed {new Date(lastAnalyzed).toLocaleString()}</span>}{report && <Button variant="ghost" size="sm" onClick={() => resume && void analyzeResume(resume)}>Re-analyze Resume</Button>}</div>

        {isLoading && (
          <Card className="mt-8 flex min-h-64 flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Building your Talent Report</h2>
            <p className="mt-2 text-sm text-muted-foreground">Gemini is reviewing your skills, experience, and ATS fit.</p>
          </Card>
        )}

        {error && !isLoading && (
          <Card className="mt-8 border border-red-500/30 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-red-300">Analysis unavailable</h2>
            <p className="mt-2 text-sm text-red-300/80">{error}</p>
            <div className="mt-5 flex justify-center gap-3">
              {resume && <Button onClick={() => void analyzeResume(resume)}>Try again</Button>}
              <Link href="/upload"><Button variant="ghost">Upload resume</Button></Link>
            </div>
          </Card>
        )}

        {report && !isLoading && (
          <div className="mt-8 space-y-6">
            <Card className="flex flex-col items-center gap-7 md:flex-row md:justify-between">
              <div><Badge variant="success">{report.candidateLevel} candidate</Badge><h2 className="mt-3 text-2xl font-bold">Recruiter snapshot</h2><p className="mt-2 max-w-2xl leading-relaxed text-slate-400">{report.recruiterSummary}</p></div>
              <div className="flex gap-6"><ScoreCircle value={report.overallScore} label="Talent Score" /><ScoreCircle value={report.atsScore} label="ATS Score" /></div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-primary" />Interview readiness</h2><Progress label="Readiness score" value={report.interviewReadiness} color="success" /><p className="mt-3 text-sm text-slate-400">Preparation signals based on the experience and skills presented in this resume.</p></Card>
              <Card><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BriefcaseBusiness className="h-5 w-5 text-accent" />Recommended roles</h2><SkillBadges skills={report.recommendedRoles} variant="accent" /><h3 className="mb-2 mt-5 text-sm font-semibold text-slate-300">Job match suggestions</h3><ReportList items={report.jobMatchSuggestions} /></Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 text-lg font-semibold">Technical skills</h2><SkillBadges skills={report.technicalSkills} /><h2 className="mb-4 mt-6 text-lg font-semibold">Soft skills</h2><SkillBadges skills={report.softSkills} variant="success" /></Card><Card><h2 className="mb-4 text-lg font-semibold">Strengths</h2><ReportList items={report.strengths} /><h2 className="mb-4 mt-6 text-lg font-semibold">Skill gaps</h2><SkillBadges skills={report.missingSkills} variant="warning" /></Card></div>

            <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5 text-primary" />Experience summary</h2><p className="leading-relaxed text-slate-400">{report.experienceSummary || 'No experience summary generated.'}</p><h2 className="mb-4 mt-6 flex items-center gap-2 text-lg font-semibold"><GraduationCap className="h-5 w-5 text-accent" />Education summary</h2><p className="leading-relaxed text-slate-400">{report.educationSummary || 'No education summary generated.'}</p></Card><Card><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Lightbulb className="h-5 w-5 text-amber-400" />Resume improvements</h2><ReportList items={report.improvementSuggestions} /><h2 className="mb-4 mt-6 text-lg font-semibold">Potential concerns</h2><ReportList items={report.weaknesses} empty="No material concerns identified." /></Card></div>

            <Card><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><MessageSquareText className="h-5 w-5 text-primary" />Personalized interview questions</h2><ol className="grid gap-3 md:grid-cols-2">{report.interviewQuestions.map((question, index) => <li key={question} className="rounded-xl bg-black/20 p-4 text-sm leading-relaxed text-slate-300"><span className="mr-2 font-semibold text-primary">{index + 1}.</span>{question}</li>)}</ol></Card>
          </div>
        )}
      </main>
    </div>
  );
}
