import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewPrep } from '@/lib/gemini';
import type { Job, TalentReport } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') throw new Error('A candidate analysis is required.');
    const { job, analysis } = body as { job?: Job; analysis?: TalentReport };
    if (!analysis?.technicalSkills) throw new Error('A candidate analysis is required.');
    
    return NextResponse.json({ prep: await generateInterviewPrep(analysis, job) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate interview prep. Please try again.';
    console.error('Interview prep error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
