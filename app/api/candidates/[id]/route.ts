import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await prisma.user.findFirst({
      where: { id, role: 'CANDIDATE' },
      include: { resumes: { orderBy: { createdAt: 'desc' }, include: { analysis: true } } },
    });
    if (!user) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });

    const resumes = user.resumes.map((resume) => {
      const analysis = resume.analysis;
      const report = analysis ? parseJson<Record<string, unknown>>(analysis.report, {}) : {};
      return {
        id: resume.id, fileName: resume.fileName, createdAt: resume.createdAt.toISOString(),
        status: analysis ? 'Analyzed' : 'Uploaded', talentScore: analysis?.talentScore ?? null,
        atsScore: analysis?.atsScore ?? null, report,
        verifiedSkills: analysis ? parseJson<Record<string, unknown>>(analysis.verifiedSkills, {}) : {},
        extractedProjects: analysis ? parseJson<unknown[]>(analysis.extractedProjects, []) : [],
      };
    });
    return NextResponse.json({ candidate: { id: user.id, name: user.name, email: user.email, profilePhoto: user.profilePhoto, githubUrl: user.githubUrl, linkedinUrl: user.linkedinUrl, portfolioUrl: user.portfolioUrl, githubInsights: user.githubInsights ? parseJson<unknown>(user.githubInsights, null) : null, registeredAt: user.createdAt.toISOString(), resumes } });
  } catch (error) {
    console.error('Candidate profile error:', error);
    return NextResponse.json({ error: 'Unable to load this candidate.' }, { status: 500 });
  }
}
