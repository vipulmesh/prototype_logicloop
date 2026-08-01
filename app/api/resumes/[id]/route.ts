import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { analysis: true, user: { select: { githubUrl: true, linkedinUrl: true, portfolioUrl: true, githubInsights: true } } },
  });

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
  }

  return NextResponse.json({
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      pageCount: resume.pageCount,
      text: resume.extractedText,
      fileData: `data:${resume.mimeType};base64,${Buffer.from(resume.fileData).toString('base64')}`,
      profile: resume.user ? {
        githubUrl: resume.user.githubUrl,
        linkedinUrl: resume.user.linkedinUrl,
        portfolioUrl: resume.user.portfolioUrl,
        githubInsights: resume.user.githubInsights ? JSON.parse(resume.user.githubInsights) : null,
      } : null,
    },
    analysis: resume.analysis
      ? {
          report: JSON.parse(resume.analysis.report),
          analyzedAt: resume.analysis.createdAt,
        }
      : null,
  });
}
