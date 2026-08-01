'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, BriefcaseBusiness, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getApplications, getAvailableJobs } from '@/lib/demo-jobs';
import type { Job, JobApplication, TalentReport } from '@/types';
import { cn } from '@/lib/utils';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [report, setReport] = useState<TalentReport | null>(null);

  useEffect(() => {
    void Promise.all([getAvailableJobs(), getApplications()]).then(([availableJobs, savedApplications]) => {
      setJobs(availableJobs);
      setApplications(savedApplications);
    });

    const resumeId = localStorage.getItem('talentai_resume_id') || sessionStorage.getItem('talentai_resume_id');
    if (resumeId) void fetch(`/api/resumes/${resumeId}`).then((response) => response.json()).then((data) => {
      if (data.analysis?.report) setReport(data.analysis.report as TalentReport);
    }).catch(() => undefined);
  }, []);

  const calculateMatch = (job: Job, report: TalentReport | null) => {
    if (!report) return null;

    const candidateSkills = new Set([
      ...report.technicalSkills.map(s => s.toLowerCase()),
      ...report.softSkills.map(s => s.toLowerCase()),
      ...report.strengths.map(s => s.toLowerCase())
    ]);

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    job.skills.forEach(skill => {
      const s = skill.toLowerCase();
      let found = false;
      candidateSkills.forEach(cs => {
        if (cs.includes(s) || s.includes(cs)) {
          found = true;
        }
      });
      if (found) {
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const skillMatchPercentage = job.skills.length > 0 
      ? (matchingSkills.length / job.skills.length) * 100 
      : 100;

    const baseScore = (report.overallScore + report.atsScore) / 2;
    const matchScore = Math.round((skillMatchPercentage * 0.7) + (baseScore * 0.3));

    let suitability = 'Low';
    if (matchScore >= 75) suitability = 'Excellent';
    else if (matchScore >= 60) suitability = 'Good';
    else if (matchScore >= 45) suitability = 'Moderate';

    let why = 'Matches your general profile.';
    if (suitability === 'Excellent') why = 'Strong alignment with your core technical skills and experience level.';
    else if (suitability === 'Good') why = 'Good match for your skillset, with a few missing requirements.';
    else if (suitability === 'Moderate') why = 'You have some overlapping skills but might need to upskill.';
    else why = 'This role requires skills outside your current profile.';

    let experienceRequired = 'Any';
    const desc = job.description.toLowerCase();
    if (desc.includes('senior') || desc.includes('lead') || desc.includes('5+ years') || desc.includes('5 years')) {
      experienceRequired = 'Senior';
    } else if (desc.includes('mid') || desc.includes('3+ years') || desc.includes('3 years') || desc.includes('2+ years')) {
      experienceRequired = 'Mid-level';
    } else if (desc.includes('junior') || desc.includes('1+ year') || desc.includes('1 year')) {
      experienceRequired = 'Junior';
    } else if (desc.includes('fresher') || desc.includes('intern')) {
      experienceRequired = 'Fresher';
    }

    return { matchScore, matchingSkills, missingSkills, suitability, why, experienceRequired };
  };

  const jobsWithMatch = jobs.map(job => ({
    job,
    match: calculateMatch(job, report),
    application: applications.find((item) => item.jobId === job.id)
  })).sort((a, b) => {
    const scoreA = a.match?.matchScore ?? 0;
    const scoreB = b.match?.matchScore ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen grid-bg">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">TalentAI</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/pitch"><Button variant="ghost" size="sm">Pitch Analyzer</Button></Link>
          {report && <Link href="/dashboard"><Button variant="ghost" size="sm">My Talent Report</Button></Link>}
          <Link href="/upload"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Upload resume</Button></Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <Badge variant="accent">Candidate opportunities</Badge>
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">Find your next role</h1>
            <p className="mt-2 text-slate-400">Explore open roles and apply with your analyzed resume.</p>
          </div>
          {report && <Badge variant="success"><Sparkles size={14} className="mr-1.5" /> AI Matching Active</Badge>}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobsWithMatch.map(({ job, match, application }) => {
            return (
              <Card key={job.id} hover className="flex flex-col relative overflow-hidden">
                {match && match.matchScore >= 80 && (
                   <div className="absolute top-0 right-0 px-4 py-1 bg-success/20 text-emerald-400 text-xs font-bold rounded-bl-xl border-b border-l border-success/30 z-10">
                     Top Match
                   </div>
                )}
                
                <div className="flex items-start justify-between gap-3 pt-2">
                  <div>
                    <h2 className="text-lg font-semibold pr-16">{job.title}</h2>
                    <p className="mt-1 text-sm text-primary">{job.company}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                   <div className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</div>
                   <div className="flex items-center gap-1.5"><BriefcaseBusiness size={14} />{job.type}</div>
                </div>

                {match ? (
                  <div className="mt-5 border-y border-border py-4 my-2 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                         <span className="text-xs text-slate-400 uppercase tracking-wider block">Match Score</span>
                         <span className={cn('text-2xl font-bold', match.suitability === 'Excellent' ? 'text-emerald-400' : match.suitability === 'Good' ? 'text-accent' : 'text-amber-400')}>
                           {match.matchScore}%
                         </span>
                      </div>
                      <div className="text-right">
                         <span className="text-xs text-slate-400 uppercase tracking-wider block">Suitability</span>
                         <Badge variant={match.suitability === 'Excellent' ? 'success' : match.suitability === 'Good' ? 'accent' : 'warning'}>{match.suitability}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-300 italic mb-4">"{match.why}"</p>

                    <div className="space-y-3 text-sm">
                       <div>
                         <span className="text-slate-400 block mb-1">Required Experience:</span>
                         <span className="text-white font-medium">{match.experienceRequired}</span>
                       </div>
                       
                       {match.matchingSkills.length > 0 && (
                         <div>
                           <span className="text-slate-400 block mb-1">Matching Skills:</span>
                           <div className="flex flex-wrap gap-1.5">
                             {match.matchingSkills.map(s => <Badge key={s} variant="success">{s}</Badge>)}
                           </div>
                         </div>
                       )}
                       
                       {match.missingSkills.length > 0 && (
                         <div>
                           <span className="text-slate-400 block mb-1">Missing Skills:</span>
                           <div className="flex flex-wrap gap-1.5">
                             {match.missingSkills.map(s => <Badge key={s} variant="warning">{s}</Badge>)}
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 mt-4">
                    <p className="text-sm leading-relaxed text-slate-400">{job.description.slice(0, 150)}...</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="muted">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-300">
                    {application ? <span className="text-accent flex items-center gap-1.5"><CheckCircle2 size={15}/> Status: {application.status}</span> : job.salary}
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {!application && <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">Save Job</Button>}
                    <Link href={`/jobs/${job.id}`} className={cn("flex-1 sm:flex-none", application ? "w-full sm:w-auto" : "")}>
                      <Button size="sm" className="w-full">
                        <BriefcaseBusiness size={15} /> {application ? 'View Details' : 'Apply'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
