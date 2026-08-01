import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toApplicationView } from '@/lib/jobs';

export async function GET() { return NextResponse.json({ applications: (await prisma.application.findMany({ include: { job: true }, orderBy: { appliedAt: 'desc' } })).map(toApplicationView) }); }
export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.jobId || !body?.candidateName || !body?.analysis) return NextResponse.json({ error: 'Invalid application.' }, { status: 400 });
  const existing = await prisma.application.findFirst({ where: { jobId: body.jobId, resumeName: body.resumeName } });
  if (existing) return NextResponse.json({ application: toApplicationView(existing) });
  const application = await prisma.application.create({ data: { jobId: body.jobId, candidateName: body.candidateName, resumeName: body.resumeName, talentScore: body.talentScore, atsScore: body.atsScore, skills: JSON.stringify(body.skills || []), analysis: JSON.stringify(body.analysis) }, include: { job: true } });
  return NextResponse.json({ application: toApplicationView(application) });
}
