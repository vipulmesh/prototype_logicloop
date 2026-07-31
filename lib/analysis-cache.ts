import type { TalentReport } from '@/types';

const CACHE_KEY = 'talentai_analysis_cache';
const PENDING_ANALYSIS_KEY = 'talentai_resume_needs_analysis';

export interface ResumeFingerprint {
  fileName: string | null;
  fileSize: number | null;
  lastModified: number | null;
}

export interface CachedAnalysis {
  report: TalentReport;
  analyzedAt: string;
  fingerprint: ResumeFingerprint;
}

function fingerprintsMatch(left: ResumeFingerprint, right: ResumeFingerprint): boolean {
  return left.fileName === right.fileName
    && left.fileSize === right.fileSize
    && left.lastModified === right.lastModified;
}

function cacheKeyFor(fingerprint: ResumeFingerprint): string {
  return `${CACHE_KEY}:${encodeURIComponent(JSON.stringify(fingerprint))}`;
}

export function getCachedAnalysis(fingerprint: ResumeFingerprint): CachedAnalysis | null {
  try {
    const value = localStorage.getItem(cacheKeyFor(fingerprint));
    if (!value) return null;

    const cached = JSON.parse(value) as CachedAnalysis;
    if (!cached.report || typeof cached.analyzedAt !== 'string' || !cached.fingerprint) return null;
    return !fingerprintsMatch(cached.fingerprint, fingerprint) ? null : cached;
  } catch {
    return null;
  }
}

export function saveCachedAnalysis(report: TalentReport, fingerprint: ResumeFingerprint): CachedAnalysis {
  const cached = { report, fingerprint, analyzedAt: new Date().toISOString() };
  localStorage.setItem(cacheKeyFor(fingerprint), JSON.stringify(cached));
  return cached;
}

export function clearCachedAnalysis() {
  Object.keys(localStorage)
    .filter((key) => key === CACHE_KEY || key.startsWith(`${CACHE_KEY}:`))
    .forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('talentai_talent_report');
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
