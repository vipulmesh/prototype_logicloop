import type { InterviewPrep, Job, TalentReport } from '@/types';

const CACHE_PREFIX = 'talentai_interview_prep:';

export function getInterviewCacheKey(applicationId: string | null, analysis: TalentReport, job?: Job): string {
  return `${CACHE_PREFIX}${encodeURIComponent(JSON.stringify({
    applicationId,
    analysis,
    job: job ? { id: job.id, title: job.title, description: job.description, skills: job.skills, location: job.location, type: job.type } : null,
  }))}`;
}

export function getCachedInterviewPrep(applicationId: string | null, analysis: TalentReport, job?: Job): InterviewPrep | null {
  try {
    const value = localStorage.getItem(getInterviewCacheKey(applicationId, analysis, job));
    return value ? JSON.parse(value) as InterviewPrep : null;
  } catch {
    return null;
  }
}

export function saveCachedInterviewPrep(applicationId: string | null, analysis: TalentReport, job: Job | undefined, prep: InterviewPrep) {
  localStorage.setItem(getInterviewCacheKey(applicationId, analysis, job), JSON.stringify(prep));
}
