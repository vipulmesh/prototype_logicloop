import { NextRequest, NextResponse } from 'next/server';
import { generateTalentReport } from '@/lib/gemini';
import { getVerifiedSkillProfile } from '@/lib/skill-verification';
import { prisma } from '@/lib/prisma';
import type { GitHubProfileInsights } from '@/lib/github';

function parseGitHubInsights(value: string | null): GitHubProfileInsights | null {
  try { return value ? JSON.parse(value) as GitHubProfileInsights : null; } catch { return null; }
}

function enrichTalentScore(baseScore: number, github: GitHubProfileInsights | null, projectCount: number, verifiedSkillConfidence: number) {
  const githubSignal = github
    ? Math.min(8, Math.floor(github.repositoryCount / 8) + Math.min(2, github.primaryLanguages.length) + (github.totalContributions ? 2 : 0))
    : 0;
  const projectSignal = Math.min(3, projectCount);
  const skillSignal = verifiedSkillConfidence >= 80 ? 3 : verifiedSkillConfidence >= 60 ? 1 : 0;
  return Math.min(100, baseScore + githubSignal + projectSignal + skillSignal);
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const resumeId =
      body && typeof body === 'object' && typeof (body as { resumeId?: unknown }).resumeId === 'string'
        ? (body as { resumeId: string }).resumeId
        : '';

    if (!resumeId) {
      return NextResponse.json({ error: 'A valid resume is required.' }, { status: 400 });
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { analysis: true, user: { select: { githubInsights: true } } },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
    }

    if (resume.analysis) {
      return NextResponse.json({
        report: JSON.parse(resume.analysis.report),
        analyzedAt: resume.analysis.createdAt,
      });
    }

    const githubInsights = parseGitHubInsights(resume.user?.githubInsights ?? null);
    const report = await generateTalentReport(resume.extractedText, githubInsights);
    if (githubInsights && report.developerProfile) {
      report.developerProfile.publicRepositoryCount = githubInsights.repositoryCount;
      report.developerProfile.topProgrammingLanguages = githubInsights.primaryLanguages;
    }
    const verifiedSkills = getVerifiedSkillProfile(report);
    report.overallScore = enrichTalentScore(report.overallScore, githubInsights, report.projects?.length ?? 0, verifiedSkills.overallConfidence);
    const analysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        report: JSON.stringify(report),
        talentScore: report.overallScore,
        atsScore: report.atsScore,
        extractedProjects: JSON.stringify(report.projects ?? []),
        verifiedSkills: JSON.stringify(verifiedSkills),
      },
    });

    return NextResponse.json({ report, analyzedAt: analysis.createdAt });
  } catch (error) {
    console.error('Resume analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unable to analyze this resume. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
