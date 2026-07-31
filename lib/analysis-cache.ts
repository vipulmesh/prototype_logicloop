import type { TalentReport } from '@/types';

const CACHE_KEY = 'talentai_analysis_cache';
const PENDING_ANALYSIS_KEY = 'talentai_resume_needs_analysis';

export interface CachedAnalysis {
  report: TalentReport;
  analyzedAt: string;
}

export function getCachedAnalysis(): CachedAnalysis | null {
  try {
    const value = sessionStorage.getItem(CACHE_KEY);
    if (!value) return null;

    const cached = JSON.parse(value) as CachedAnalysis;
    return cached.report && typeof cached.analyzedAt === 'string' ? cached : null;
  } catch {
    return null;
  }
}

export function saveCachedAnalysis(report: TalentReport): CachedAnalysis {
  const cached = { report, analyzedAt: new Date().toISOString() };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  return cached;
}

export function clearCachedAnalysis() {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem('talentai_talent_report');
  sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
}

export function markResumeForAnalysis() {
  sessionStorage.setItem(PENDING_ANALYSIS_KEY, 'true');
}

export function consumeResumeAnalysisRequest(): boolean {
  const shouldAnalyze = sessionStorage.getItem(PENDING_ANALYSIS_KEY) === 'true';
  sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
  return shouldAnalyze;
}
