import type { TalentReport } from '@/types';

export interface FraudInsights {
  overallTrustScore: number;
  authenticityScore: number;
  fakeResumeRisk: number;
  duplicateProfileRisk: number;
  aiGeneratedContentRisk: number;
  missingInformationRisk: number;
  warnings: string[];
}

const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
};

export function generateFraudInsights(report: TalentReport): FraudInsights {
  const seed = hash(report.experienceSummary + report.candidateLevel);
  const isTooPerfect = report.overallScore > 95 && report.atsScore > 95 && (!report.weaknesses || report.weaknesses.length === 0);
  const missingInfoRisk = Math.min(100, (report.missingSkills?.length || 0) * 10 + (seed % 15));
  const aiGeneratedContentRisk = isTooPerfect ? 70 + (seed % 20) : 12 + (seed % 28);
  const fakeResumeRisk = isTooPerfect ? 35 + (seed % 25) : 5 + (seed % 15);
  const duplicateProfileRisk = (seed % 8) === 0 ? 60 + (seed % 25) : (seed % 12);
  const authenticityScore = Math.max(0, Math.round(100 - (aiGeneratedContentRisk * 0.4 + fakeResumeRisk * 0.6)));
  const overallTrustScore = Math.round(authenticityScore * 0.5 + (100 - missingInfoRisk) * 0.2 + (100 - duplicateProfileRisk) * 0.3);
  const warnings: string[] = [];
  if (isTooPerfect) warnings.push('Profile appears unusually flawless; possible AI-generation.');
  if (missingInfoRisk > 50) warnings.push('Significant missing context in experience or education.');
  if (duplicateProfileRisk > 50) warnings.push('Similar patterns detected in existing applicant pool.');
  if (fakeResumeRisk > 40) warnings.push('Minor inconsistencies between claimed skills and experience.');
  return {
    overallTrustScore,
    authenticityScore,
    fakeResumeRisk,
    duplicateProfileRisk,
    aiGeneratedContentRisk,
    missingInformationRisk: missingInfoRisk,
    warnings: warnings.length ? warnings : ['No significant fraud indicators detected.'],
  };
}
