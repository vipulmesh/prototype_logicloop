import type { Application, Job } from '@prisma/client';
import type { Job as JobView, JobApplication, TalentReport } from '@/types';

const parse = <T>(value: string, fallback: T): T => {
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

export const toJobView = (job: Job): JobView => ({ ...job, skills: parse<string[]>(job.skills, []) });

export const toApplicationView = (application: Application & { job?: Job }): JobApplication => ({
  id: application.id,
  jobId: application.jobId,
  jobTitle: application.job?.title ?? '',
  candidateName: application.candidateName,
  resumeName: application.resumeName,
  talentScore: application.talentScore,
  atsScore: application.atsScore,
  skills: parse<string[]>(application.skills, []),
  appliedAt: application.appliedAt.toISOString(),
  status: application.status as JobApplication['status'],
  analysis: parse<TalentReport>(application.analysis, {} as TalentReport),
});
