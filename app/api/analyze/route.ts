import { NextRequest, NextResponse } from 'next/server';
import { generateTalentReport } from '@/lib/gemini';
import { getVerifiedSkillProfile } from '@/lib/skill-verification';
import { prisma } from '@/lib/prisma';

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
      include: { analysis: true },
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

    const report = await generateTalentReport(resume.extractedText);
    const verifiedSkills = getVerifiedSkillProfile(report);
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
