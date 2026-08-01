import { GoogleGenAI } from '@google/genai';
import type { CandidateRanking, Job, TalentReport, InterviewPrep, InterviewQuestion, DeveloperProfile } from '@/types';
import type { GitHubProfileInsights } from '@/lib/github';

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
  "interviewQuestions": [],
  "developerProfile": {
    "githubProfileStrength": 0,
    "publicRepositoryCount": 0,
    "topProgrammingLanguages": [],
    "openSourceActivity": "",
    "estimatedCodingMaturity": "",
    "projectQualityScore": 0
  },
  "projects": [
    {
      "id": "proj_1",
      "title": "Project Title",
      "description": "Short Description",
      "technologies": ["React", "TypeScript"],
      "role": "Lead Engineer",
      "keyFeatures": ["Key feature 1", "Key feature 2"],
      "duration": "4 Months",
      "githubUrl": "",
      "liveDemoUrl": "",
      "innovationScore": 85,
      "technicalComplexity": 88,
      "problemSolvingScore": 86,
      "industryRelevance": 90,
      "recruiterSummary": "Detailed recruiter summary for the project."
    }
  ]
}

Scores must be integers from 0 to 100. candidateLevel must be one of Fresher, Junior, Mid, Senior.
If PUBLIC GITHUB PROFILE INSIGHTS are supplied, produce developerProfile from that public data and the extracted projects. Otherwise set developerProfile to null. estimatedCodingMaturity must be a concise level such as Emerging, Developing, Proficient, Advanced, or Expert. Extract candidate projects if present in the resume. Provide exactly 10 personalized interviewQuestions.`;

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

function asCount(value: unknown): number {
  const count = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
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

  const rawProjects = Array.isArray(report.projects) ? report.projects : [];
  const projects = rawProjects.map((p: any, idx: number) => ({
    id: asString(p.id) || `proj_${idx}_${Date.now()}`,
    title: asString(p.title) || `Project ${idx + 1}`,
    description: asString(p.description) || 'Candidate project',
    technologies: asStringArray(p.technologies),
    role: asString(p.role) || 'Developer',
    keyFeatures: asStringArray(p.keyFeatures),
    duration: asString(p.duration) || '3 Months',
    githubUrl: asString(p.githubUrl) || undefined,
    liveDemoUrl: asString(p.liveDemoUrl) || undefined,
    innovationScore: asScore(p.innovationScore) || 80,
    technicalComplexity: asScore(p.technicalComplexity) || 80,
    problemSolvingScore: asScore(p.problemSolvingScore) || 80,
    industryRelevance: asScore(p.industryRelevance) || 85,
    recruiterSummary: asString(p.recruiterSummary) || 'Extracted candidate project details.',
  }));
  const rawDeveloperProfile = report.developerProfile;
  const developerProfile: DeveloperProfile | undefined = rawDeveloperProfile && typeof rawDeveloperProfile === 'object' && !Array.isArray(rawDeveloperProfile)
    ? {
        githubProfileStrength: asScore((rawDeveloperProfile as Record<string, unknown>).githubProfileStrength),
        publicRepositoryCount: asCount((rawDeveloperProfile as Record<string, unknown>).publicRepositoryCount),
        topProgrammingLanguages: asStringArray((rawDeveloperProfile as Record<string, unknown>).topProgrammingLanguages),
        openSourceActivity: asString((rawDeveloperProfile as Record<string, unknown>).openSourceActivity),
        estimatedCodingMaturity: asString((rawDeveloperProfile as Record<string, unknown>).estimatedCodingMaturity),
        projectQualityScore: asScore((rawDeveloperProfile as Record<string, unknown>).projectQualityScore),
      }
    : undefined;

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
    developerProfile,
    projects: projects.length ? projects : undefined,
  };
}

export async function generateTalentReport(resumeText: string, githubInsights?: GitHubProfileInsights | null): Promise<TalentReport> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY and try again.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `${prompt}\n\nRESUME:\n${resumeText.slice(0, 30000)}${githubInsights ? `\n\nPUBLIC GITHUB PROFILE INSIGHTS:\n${JSON.stringify(githubInsights)}\nUse these public signals to refine the talent score, technical skills, project assessment, and recruiter summary. Do not claim evidence that is not present.` : ''}`,
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

export async function generateInterviewPrep(report: TalentReport, job?: Job): Promise<InterviewPrep> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured. Set GEMINI_API_KEY and try again.');

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert technical interviewer and HR manager.
Create a comprehensive interview preparation guide for this candidate based on their resume analysis${job ? ' and the following job description' : ''}.
Return ONLY a valid JSON object: no markdown, no code fences, and no commentary.

Format:
{
  "readinessScore": 85,
  "questions": [
    {
      "question": "Question text",
      "type": "technical", // Must be one of: technical, hr, behavioral, project, coding, followup
      "difficulty": "Medium", // Must be one of: Easy, Medium, Hard
      "expectedKeyPoints": ["Point 1", "Point 2"]
    }
  ]
}

Ensure you generate exactly:
- 10 technical questions
- 5 hr questions
- 5 behavioral questions
- 3 project-based questions
- 2 coding questions
- 3 follow-up questions
Total 28 questions. Provide detailed expected key points.`;

  const contents = `${prompt}\n\nCANDIDATE ANALYSIS:\n${JSON.stringify(report)}${job ? `\n\nJOB:\n${JSON.stringify(job)}` : ''}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents,
    config: { responseMimeType: 'application/json' },
  });
  if (!response.text) throw new Error('Gemini returned an empty interview prep response. Please try again.');

  try {
    const value = JSON.parse(response.text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '')) as Record<string, unknown>;
    if (!value || typeof value !== 'object' || !Array.isArray(value.questions)) throw new Error();
    
    return {
      readinessScore: typeof value.readinessScore === 'number' ? value.readinessScore : 0,
      questions: (value.questions as any[]).map(q => ({
        question: typeof q.question === 'string' ? q.question : '',
        type: ['technical', 'hr', 'behavioral', 'project', 'coding', 'followup'].includes(q.type) ? q.type : 'technical',
        difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
        expectedKeyPoints: Array.isArray(q.expectedKeyPoints) ? q.expectedKeyPoints.map((s: any) => String(s)) : []
      }))
    };
  } catch {
    throw new Error('Gemini returned an invalid interview prep response. Please try again.');
  }
}
