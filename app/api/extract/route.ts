import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { extractCandidateProfileLinks, fetchGitHubProfileInsights } from '@/lib/github';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Candidate authentication is required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    const isPDF = file.type === 'application/pdf';
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isPDF && !isDOCX) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported' },
        { status: 400 },
      );
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be under 5 MB' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let pages = 1; // Default for DOCX

    if (isPDF) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });

      try {
        const parsed = await parser.getText();
        text = parsed.text?.trim();
        pages = parsed.total;
      } finally {
        await parser.destroy();
      }
    } else if (isDOCX) {
      const mammothModule = await import('mammoth');
      const mammoth = (mammothModule as any).default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      text = result.value?.trim();
    }

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from the file. The file may be image-based or empty.' },
        { status: 422 },
      );
    }

    const profileLinks = extractCandidateProfileLinks(text);
    const githubInsights = profileLinks.githubUrl ? await fetchGitHubProfileInsights(profileLinks.githubUrl) : null;
    await prisma.user.update({
      where: { id: session.id },
      data: {
        githubUrl: profileLinks.githubUrl,
        linkedinUrl: profileLinks.linkedinUrl,
        portfolioUrl: profileLinks.portfolioUrl,
        githubInsights: githubInsights ? JSON.stringify(githubInsights) : null,
      },
    });

    const resume = await prisma.resume.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileData: buffer,
        extractedText: text,
        pageCount: pages,
        userId: session.id,
      },
      select: { id: true },
    });

    return NextResponse.json({
      resumeId: resume.id,
      text,
      pages,
      characters: text.length,
    });
  } catch (error) {
    console.error('File extraction error:', error);
    const message = error instanceof Error ? error.message : 'Unknown extraction error';

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
