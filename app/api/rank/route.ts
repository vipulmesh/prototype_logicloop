import { NextRequest, NextResponse } from 'next/server';
import { generateCandidateRanking } from '@/lib/gemini';
import type { Job, TalentReport } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') throw new Error('A job and candidate analysis are required.');
    const { job, analysis } = body as { job?: Job; analysis?: TalentReport };
    if (!job?.id || !job.description || !analysis?.technicalSkills) throw new Error('A job and candidate analysis are required.');
    return NextResponse.json({ ranking: await generateCandidateRanking(analysis, job) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to rank this candidate. Please try again.';
    console.error('Candidate ranking error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
