/* ─── Resume Analysis ─── */
export interface ResumeAnalysis {
  summary: string;
  talentScore: number;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  technicalSkills: string[];
  softSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface TalentReport {
  overallScore: number;
  atsScore: number;
  candidateLevel: 'Fresher' | 'Junior' | 'Mid' | 'Senior';
  technicalSkills: string[];
  softSkills: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  experienceSummary: string;
  educationSummary: string;
  recommendedRoles: string[];
  jobMatchSuggestions: string[];
  improvementSuggestions: string[];
  recruiterSummary: string;
  interviewReadiness: number;
  interviewQuestions: string[];
}

/* ─── Skill Breakdown ─── */
export interface SkillBreakdown {
  name: string;
  level: number; // 0-100
  category: 'technical' | 'soft';
}

/* ─── Job ─── */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  skills: string[];
  description: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  resumeName: string;
  talentScore: number;
  atsScore: number;
  skills: string[];
  appliedAt: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected';
}

/* ─── Job Match ─── */
export interface JobMatch {
  title: string;
  company: string;
  matchPercentage: number;
  reasons: string[];
  missingSkills: string[];
}

/* ─── Resume Improvement ─── */
export interface ResumeImprovement {
  betterSummary: string;
  betterProjectDescriptions: string[];
  betterSkillsSection: string;
}

/* ─── Upload State ─── */
export type UploadStatus = 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error';
