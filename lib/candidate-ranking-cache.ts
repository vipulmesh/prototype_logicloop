import type { CandidateRanking, Job, JobApplication } from '@/types';

const CACHE_PREFIX = 'talentai_candidate_ranking:';

function keyFor(application: JobApplication, job: Job): string {
  return `${CACHE_PREFIX}${encodeURIComponent(JSON.stringify({
    applicationId: application.id,
    analysis: application.analysis,
    job: { id: job.id, title: job.title, description: job.description, skills: job.skills, location: job.location, type: job.type },
  }))}`;
}

export function getCachedCandidateRanking(application: JobApplication, job: Job): CandidateRanking | null {
  try {
    const value = localStorage.getItem(keyFor(application, job));
    return value ? JSON.parse(value) as CandidateRanking : null;
  } catch {
    return null;
  }
}

export function saveCachedCandidateRanking(application: JobApplication, job: Job, ranking: CandidateRanking) {
  localStorage.setItem(keyFor(application, job), JSON.stringify(ranking));
}
