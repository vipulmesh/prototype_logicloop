import { NextRequest, NextResponse } from 'next/server';
import { generateTalentReport } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const resumeText =
      body && typeof body === 'object' && typeof (body as { resumeText?: unknown }).resumeText === 'string'
        ? (body as { resumeText: string }).resumeText.trim()
        : '';

    if (resumeText.length < 50) {
      return NextResponse.json({ error: 'A valid extracted resume is required.' }, { status: 400 });
    }

    const report = await generateTalentReport(resumeText);
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Resume analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unable to analyze this resume. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
