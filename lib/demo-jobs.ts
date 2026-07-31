import jobs from '@/data/jobs.json';
import type { Job, JobApplication } from '@/types';

interface StoredRecruiterJob {
  id: string;
  title: string;
  location: string;
  type: string;
  skills: string;
  description: string;
}

interface StoredCompany {
  name?: string;
}

function readSession<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function getAvailableJobs(): Job[] {
  const company = readSession<StoredCompany>('talentai_company', {});
  const recruiterJobs = readSession<StoredRecruiterJob[]>('talentai_recruiter_jobs', []).map((job) => ({
    ...job,
    company: company.name || 'TalentAI Partner',
    salary: 'Competitive',
    skills: job.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
  }));

  return [...jobs, ...recruiterJobs];
}

export function getApplications(): JobApplication[] {
  return readSession<JobApplication[]>('talentai_job_applications', []);
}

export function saveApplications(applications: JobApplication[]) {
  sessionStorage.setItem('talentai_job_applications', JSON.stringify(applications));
}
