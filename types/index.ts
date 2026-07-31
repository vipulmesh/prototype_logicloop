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
