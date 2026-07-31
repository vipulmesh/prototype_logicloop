import { GoogleGenAI } from '@google/genai';
import type { TalentReport } from '@/types';

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
