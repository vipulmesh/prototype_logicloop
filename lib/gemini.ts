import { GoogleGenAI } from '@google/genai';
import type { CandidateRanking, Job, TalentReport } from '@/types';

const REPORT_FIELDS = [
  'overallScore', 'atsScore', 'candidateLevel', 'technicalSkills', 'softSkills',
  'strengths', 'weaknesses', 'missingSkills', 'experienceSummary', 'educationSummary',
  'recommendedRoles', 'jobMatchSuggestions', 'improvementSuggestions', 'recruiterSummary',
  'interviewReadiness', 'interviewQuestions',
] as const;

const prompt = `You are an experienced Technical Recruiter, HR Manager, and ATS Scanner.
Analyze the resume supplied below and return ONLY a valid JSON object: no markdown, no code fences, and no commentary.

Use exactly these fields:
{
  "overallScore": 0,
  "atsScore": 0,
  "candidateLevel": "Fresher",
  "technicalSkills": [],
  "softSkills": [],
  "strengths": [],
  "weaknesses": [],
  "missingSkills": [],
  "experienceSummary": "",
  "educationSummary": "",
  "recommendedRoles": [],
  "jobMatchSuggestions": [],
  "improvementSuggestions": [],
  "recruiterSummary": "",
  "interviewReadiness": 0,
  "interviewQuestions": []
}

Scores must be integers from 0 to 100. candidateLevel must be one of Fresher, Junior, Mid, Senior.
Be specific to evidence in the resume. Provide exactly 10 personalized interviewQuestions.`;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function asScore(value: unknown): number {
  const score = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(score) ? Math.round(Math.min(100, Math.max(0, score))) : 0;
}

function parseReport(text: string): TalentReport {
  const json = text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '');
  let value: unknown;

  try {
    value = JSON.parse(json);
  } catch {
    throw new Error('Gemini returned an invalid analysis response. Please try again.');
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Gemini returned an invalid analysis response. Please try again.');
  }

  const report = value as Record<string, unknown>;
  if (!REPORT_FIELDS.every((field) => field in report)) {
    throw new Error('Gemini returned an incomplete analysis response. Please try again.');
  }

  const level = asString(report.candidateLevel);
  const candidateLevel: TalentReport['candidateLevel'] =
    level === 'Junior' || level === 'Mid' || level === 'Senior' ? level : 'Fresher';
  const interviewQuestions = asStringArray(report.interviewQuestions);

  if (interviewQuestions.length !== 10) {
    throw new Error('Gemini returned an incomplete analysis response. Please try again.');
  }

  return {
    overallScore: asScore(report.overallScore),
    atsScore: asScore(report.atsScore),
    candidateLevel,
    technicalSkills: asStringArray(report.technicalSkills),
    softSkills: asStringArray(report.softSkills),
    strengths: asStringArray(report.strengths),
    weaknesses: asStringArray(report.weaknesses),
    missingSkills: asStringArray(report.missingSkills),
    experienceSummary: asString(report.experienceSummary),
    educationSummary: asString(report.educationSummary),
    recommendedRoles: asStringArray(report.recommendedRoles),
    jobMatchSuggestions: asStringArray(report.jobMatchSuggestions),
    improvementSuggestions: asStringArray(report.improvementSuggestions),
    recruiterSummary: asString(report.recruiterSummary),
    interviewReadiness: asScore(report.interviewReadiness),
    interviewQuestions,
  };
}

export async function generateTalentReport(resumeText: string): Promise<TalentReport> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY and try again.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `${prompt}\n\nRESUME:\n${resumeText.slice(0, 30000)}`,
    config: { responseMimeType: 'application/json' },
  });

  if (!response.text) {
    throw new Error('Gemini returned an empty analysis response. Please try again.');
  }

  return parseReport(response.text);
}

export async function generateCandidateRanking(report: TalentReport, job: Job): Promise<CandidateRanking> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured. Set GEMINI_API_KEY and try again.');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `You are an experienced recruiter. Compare the existing candidate analysis with the job below. Do not analyze a resume or invent evidence. Return ONLY valid JSON with exactly these fields:\n{\n  "matchScore": 0,\n  "skillMatchPercentage": 0,\n  "matchingSkills": [],\n  "missingSkills": [],\n  "strengths": [],\n  "weaknesses": [],\n  "hireRecommendation": "Consider",\n  "interviewReadiness": 0,\n  "recruiterSummary": ""\n}\nScores must be integers from 0 to 100. hireRecommendation must be Hire, Consider, or Reject. recruiterSummary must be 2-3 concise lines.\n\nJOB:\n${JSON.stringify(job)}\n\nEXISTING CANDIDATE ANALYSIS:\n${JSON.stringify(report)}`,
    config: { responseMimeType: 'application/json' },
  });
  if (!response.text) throw new Error('Gemini returned an empty ranking response. Please try again.');

  try {
    const value = JSON.parse(response.text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '')) as Record<string, unknown>;
    const recommendation = asString(value.hireRecommendation);
    if (!value || typeof value !== 'object' || !['Hire', 'Consider', 'Reject'].includes(recommendation)) throw new Error();
    return {
      matchScore: asScore(value.matchScore),
      skillMatchPercentage: asScore(value.skillMatchPercentage),
      matchingSkills: asStringArray(value.matchingSkills),
      missingSkills: asStringArray(value.missingSkills),
      strengths: asStringArray(value.strengths),
      weaknesses: asStringArray(value.weaknesses),
      hireRecommendation: recommendation as CandidateRanking['hireRecommendation'],
      interviewReadiness: asScore(value.interviewReadiness),
      recruiterSummary: asString(value.recruiterSummary),
    };
  } catch {
    throw new Error('Gemini returned an invalid ranking response. Please try again.');
  }
}
