'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  ShieldCheck,
  Github,
  GitPullRequest,
  GitCommit,
  Activity,
  FolderGit2,
  Plus
} from 'lucide-react';
import { Badge, Button, Card, Progress, ScoreCircle } from '@/components/ui';
import { getVerifiedSkillProfile } from '@/lib/skill-verification';
import { extractProjectsFromReport } from '@/lib/project-extraction';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import type { TalentReport, CandidateProject } from '@/types';
import { cn } from '@/lib/utils';

interface StoredResume {
  id: string;
  text: string;
  fileName: string | null;
  fileSize: number | null;
  lastModified: number | null;
  fileData?: string | null;
  profile?: {
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    githubInsights: { repositoryCount: number; followers: number; primaryLanguages: string[] } | null;
  } | null;
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

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

interface ContributionAnalytics { score: number; projects: number; contributions: number; commits: number; pullRequests: number; recentActivity: { repo: string; action: string; date: string }[]; }

export default function DashboardPage() {
  const router = useRouter();
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [report, setReport] = useState<TalentReport | null>(null);
  const [projects, setProjects] = useState<CandidateProject[]>([]);
  const [editingProject, setEditingProject] = useState<CandidateProject | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [teamContribution, setTeamContribution] = useState<ContributionAnalytics | null>(null);

  const analyzeResume = async (storedResume: StoredResume) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: storedResume.id }),
      });
      const data: unknown = await response.json();

      if (!response.ok || !data || typeof data !== 'object' || !('report' in data)) {
        const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Unable to analyze this resume. Please try again.';
        throw new Error(message);
      }

      const talentReport = data.report as TalentReport;
      setReport(talentReport);
      const analyzedAt = (data as { analyzedAt?: unknown }).analyzedAt;
      setLastAnalyzed(typeof analyzedAt === 'string' ? analyzedAt : new Date().toISOString());
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Unable to analyze this resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const resumeId = localStorage.getItem('talentai_resume_id') || sessionStorage.getItem('talentai_resume_id');
    if (!resumeId) {
      setError('Upload a resume before requesting an analysis.');
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`);
        const data: unknown = await response.json();
        if (!response.ok || !data || typeof data !== 'object' || !('resume' in data)) throw new Error();

        const storedResume = (data as { resume: StoredResume }).resume;
        setResume(storedResume);
        const analysis = (data as { analysis?: { report: TalentReport; analyzedAt: string } | null }).analysis;
        if (analysis) {
          setReport(analysis.report);
          setLastAnalyzed(analysis.analyzedAt);
          setIsLoading(false);
        } else {
          await analyzeResume(storedResume);
        }
      } catch {
        setError('The uploaded resume could not be read. Please upload it again.');
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => { void fetch('/api/contributions').then((response) => response.json()).then((data) => setTeamContribution(data.analytics)).catch(() => undefined); }, []);

  useEffect(() => {
    if (report) {
      const extracted = extractProjectsFromReport(report, resume?.text);
      setProjects(extracted);
    }
  }, [report, resume?.text]);

  const handleSaveProject = (updatedProject: CandidateProject) => {
    if (!report || !resume) return;
    const existingIdx = projects.findIndex((p) => p.id === updatedProject.id);
    let nextProjects: CandidateProject[];
    if (existingIdx >= 0) {
      nextProjects = [...projects];
      nextProjects[existingIdx] = updatedProject;
    } else {
      nextProjects = [updatedProject, ...projects];
    }
    setProjects(nextProjects);
    const updatedReport: TalentReport = { ...report, projects: nextProjects };
    setReport(updatedReport);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!report || !resume) return;
    const nextProjects = projects.filter((p) => p.id !== projectId);
    setProjects(nextProjects);
    const updatedReport: TalentReport = { ...report, projects: nextProjects };
    setReport(updatedReport);
  };

  const skillProfile = report ? getVerifiedSkillProfile(report) : null;

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
        <div className="flex gap-2"><Link href="/pitch"><Button variant="ghost" size="sm">Pitch Analyzer</Button></Link><Link href="/jobs"><Button variant="ghost" size="sm">Browse jobs</Button></Link><Link href="/upload?replace=true"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Replace Resume</Button></Link></div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8">
        <Badge variant="default" className="px-4 py-1.5"><Sparkles size={13} className="mr-1.5" />AI Talent Report</Badge>
        <h1 className="mt-5 text-3xl font-bold md:text-4xl">Your resume intelligence report</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-slate-400">
          <p>{resume?.fileName || 'Resume'} · Gemini-powered recruiter and ATS analysis</p>
          <span className="text-xs text-muted-foreground">Analysis status: {isLoading ? 'Analyzing' : report ? 'Complete' : 'Unavailable'}</span>
          {lastAnalyzed && <span className="text-xs text-muted-foreground">Last analyzed {new Date(lastAnalyzed).toLocaleString()}</span>}
          {resume?.profile && (resume.profile.githubUrl || resume.profile.linkedinUrl || resume.profile.portfolioUrl) && <div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-slate-500">Profile links:</span>{resume.profile.githubUrl && <a href={resume.profile.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">GitHub</a>}{resume.profile.linkedinUrl && <a href={resume.profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">LinkedIn</a>}{resume.profile.portfolioUrl && <a href={resume.profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Portfolio</a>}{resume.profile.githubInsights && <span className="text-slate-400">{resume.profile.githubInsights.repositoryCount} repos · {resume.profile.githubInsights.followers} followers · {resume.profile.githubInsights.primaryLanguages.join(', ') || 'No languages listed'}</span>}</div>}
          {report && (
            <>
              {resume?.fileData && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const w = window.open('about:blank');
                    if (w && resume.fileData) {
                      w.document.write(`<iframe src="${resume.fileData}" style="width:100%;height:100%;border:none;"></iframe>`);
                    }
                  }}>
                    View Resume
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (resume.fileData) {
                      const a = document.createElement('a');
                      a.href = resume.fileData;
                      a.download = resume.fileName || 'resume';
                      a.click();
                    }
                  }}>
                    Download Resume
                  </Button>
                </>
              )}
              <Link href="/upload?replace=true"><Button variant="ghost" size="sm">Replace Resume</Button></Link>
            </>
          )}
        </div>

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

            {/* AI Skill Verification Module */}
            <Card className="border border-primary/30">
              <div className="flex flex-col md:flex-row justify-between gap-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-white"><ShieldCheck className="text-primary" /> AI Skill Verification Profile</h2>
                    <Badge variant="accent">{skillProfile?.candidateLevel} Level</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Verified skill profile generated from cached AI resume analysis context.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center bg-black/30 px-4 py-2 rounded-xl border border-border">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Skill Confidence Score</p>
                    <p className="text-3xl font-bold text-emerald-400">{skillProfile?.overallConfidence}%</p>
                  </div>
                </div>
              </div>

              {/* Top 5 Strongest Skills */}
              {skillProfile?.topStrongestSkills.length ? (
                <div className="mb-6 rounded-xl bg-black/20 p-4 border border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" /> Top 5 Strongest Verified Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillProfile.topStrongestSkills.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-semibold text-white">{skill.name}</span>
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">{skill.level}</Badge>
                        <span className="text-xs font-bold text-emerald-400">{skill.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              
              <div className="grid gap-6 lg:grid-cols-2 border-t border-border pt-6">
                {/* Verified Technical Skills */}
                <div>
                  <h3 className="text-md font-semibold mb-4 text-white flex items-center justify-between">
                    <span>Verified Technical Skills</span>
                    <Badge variant="default">{skillProfile?.verifiedTechnicalSkills.length || 0} Skills</Badge>
                  </h3>
                  <div className="space-y-2.5">
                    {skillProfile?.verifiedTechnicalSkills.length ? (
                      skillProfile.verifiedTechnicalSkills.map((skill) => (
                        <div key={skill.name} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                             <Badge variant={skill.level === 'Advanced' ? 'success' : skill.level === 'Intermediate' ? 'accent' : 'default'} className="w-24 justify-center text-xs">
                               {skill.level}
                             </Badge>
                             <span className="font-medium text-sm text-white">{skill.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{skill.confidence}% Verified</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No technical skills detected.</p>
                    )}
                  </div>
                </div>

                {/* Verified Soft Skills & Skills to Improve */}
                <div className="space-y-6">
                   <div>
                     <h3 className="text-md font-semibold mb-4 text-white flex items-center justify-between">
                       <span>Verified Soft Skills</span>
                       <Badge variant="accent">{skillProfile?.verifiedSoftSkills.length || 0} Skills</Badge>
                     </h3>
                     <div className="space-y-2.5">
                       {skillProfile?.verifiedSoftSkills.length ? (
                         skillProfile.verifiedSoftSkills.map((skill) => (
                           <div key={skill.name} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-border">
                             <div className="flex items-center gap-3">
                                <Badge variant={skill.level === 'Advanced' ? 'success' : skill.level === 'Intermediate' ? 'accent' : 'default'} className="w-24 justify-center text-xs">
                                  {skill.level}
                                </Badge>
                                <span className="font-medium text-sm text-white">{skill.name}</span>
                             </div>
                             <span className="text-xs font-semibold text-slate-400">{skill.confidence}% Verified</span>
                           </div>
                         ))
                       ) : (
                         <p className="text-sm text-muted-foreground">No soft skills detected.</p>
                       )}
                     </div>
                   </div>

                   <div>
                     <h3 className="text-md font-semibold mb-3 text-white">Skills to Improve</h3>
                     <SkillBadges skills={skillProfile?.skillsToImprove || []} variant="warning" />
                     <div className="mt-4">
                       <ReportList items={report.improvementSuggestions || []} />
                     </div>
                   </div>
                </div>
              </div>
            </Card>

            {/* AI Project Extraction Module */}
            <Card className="border border-primary/30">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                    <FolderGit2 className="text-primary" /> Extracted Candidate Projects
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-400">
                    AI-extracted projects and technical complexity metrics parsed from your resume.
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsAddingProject(true)}>
                  <Plus size={15} /> Add Project Manually
                </Button>
              </div>

              {projects.length > 0 ? (
                <div className="grid gap-5">
                  {projects.map((proj) => (
                    <ProjectCard
                      key={proj.id}
                      project={proj}
                      onEdit={(p) => setEditingProject(p)}
                      onDelete={(id) => handleDeleteProject(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-black/20 rounded-2xl border border-dashed border-border p-6">
                  <FolderGit2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold text-white">No Projects Detected</h3>
                  <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                    No projects were automatically parsed from this resume. You can manually add your projects to showcase your technical build portfolio to recruiters.
                  </p>
                  <Button className="mt-4" onClick={() => setIsAddingProject(true)}>
                    <Plus size={15} /> Add Your First Project
                  </Button>
                </div>
              )}
            </Card>

            {/* Project Edit/Add Modal */}
            {(editingProject || isAddingProject) && (
              <ProjectFormModal
                project={editingProject}
                onSave={handleSaveProject}
                onClose={() => {
                  setEditingProject(null);
                  setIsAddingProject(false);
                }}
              />
            )}

            {/* Team Contribution Analytics Module */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Github className="text-accent" /> Team Contribution Analytics</h2>
                  <p className="mt-2 text-sm text-slate-400">Open-source and team activity signals.</p>
                </div>
                <ScoreCircle value={teamContribution?.score ?? 0} label="Impact" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/20 p-4 rounded-xl border border-border text-center">
                  <FileText className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{teamContribution?.projects ?? 0}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Projects</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-border text-center">
                  <Activity className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
                  <p className="text-2xl font-bold">{teamContribution?.contributions ?? 0}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Contributions</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-border text-center">
                  <GitCommit className="h-5 w-5 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold">{teamContribution?.commits ?? 0}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Commits</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-border text-center">
                  <GitPullRequest className="h-5 w-5 mx-auto mb-2 text-amber-400" />
                  <p className="text-2xl font-bold">{teamContribution?.pullRequests ?? 0}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Pull Requests</p>
                </div>
              </div>
              
              <div className="border-t border-border pt-6">
                <h3 className="text-md font-semibold mb-4 text-white">Recent Activity</h3>
                <div className="space-y-3">
                  {(teamContribution?.recentActivity ?? []).map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Github size={16} className="text-slate-400" />
                        <span className="font-medium text-white">{activity.repo}</span>
                        <span className="text-slate-400">— {activity.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5 text-primary" />Experience summary</h2><p className="leading-relaxed text-slate-400">{report.experienceSummary || 'No experience summary generated.'}</p><h2 className="mb-4 mt-6 flex items-center gap-2 text-lg font-semibold"><GraduationCap className="h-5 w-5 text-accent" />Education summary</h2><p className="leading-relaxed text-slate-400">{report.educationSummary || 'No education summary generated.'}</p></Card><Card><h2 className="mb-4 mt-2 text-lg font-semibold text-amber-400">Potential concerns</h2><ReportList items={report.weaknesses} empty="No material concerns identified." /></Card></div>

            <Card><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><MessageSquareText className="h-5 w-5 text-primary" />Personalized interview questions</h2><ol className="grid gap-3 md:grid-cols-2">{report.interviewQuestions.map((question, index) => <li key={question} className="rounded-xl bg-black/20 p-4 text-sm leading-relaxed text-slate-300"><span className="mr-2 font-semibold text-primary">{index + 1}.</span>{question}</li>)}</ol></Card>
          </div>
        )}
      </main>
    </div>
  );
}
