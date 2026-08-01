import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

type CandidateUser = {
  id: string; name: string; email: string | null; profilePhoto: string | null; createdAt: Date;
  resumes: Array<{ fileName: string; analysis: { talentScore: number; atsScore: number; report: string; verifiedSkills: string; extractedProjects: string } | null }>;
};

function toCandidate(user: CandidateUser) {
  const resume = user.resumes[0] ?? null;
  const analysis = resume?.analysis ?? null;
  const report = analysis ? parseJson<Record<string, unknown>>(analysis.report, {}) : {};
  const verifiedSkills = analysis ? parseJson<Record<string, unknown>>(analysis.verifiedSkills, {}) : {};
  const extractedProjects = analysis ? parseJson<unknown[]>(analysis.extractedProjects, []) : [];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    registeredAt: user.createdAt.toISOString(),
    resumeStatus: resume ? (analysis ? 'Analyzed' : 'Uploaded') : 'Not uploaded',
    resumeName: resume?.fileName ?? null,
    talentScore: analysis?.talentScore ?? null,
    atsScore: analysis?.atsScore ?? null,
    verifiedSkills,
    extractedProjects,
    technicalSkills: Array.isArray(report.technicalSkills) ? report.technicalSkills : [],
    education: typeof report.educationSummary === 'string' ? report.educationSummary : '',
    experience: typeof report.experienceSummary === 'string' ? report.experienceSummary : '',
    report,
  };
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CANDIDATE' },
      include: {
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { analysis: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ candidates: users.map(toCandidate) });
  } catch (error) {
    console.error('Candidate directory error:', error);
    return NextResponse.json({ error: 'Unable to load candidates.' }, { status: 500 });
  }
}
