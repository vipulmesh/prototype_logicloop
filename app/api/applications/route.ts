import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toApplicationView } from '@/lib/jobs';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  const where = session.role === 'CANDIDATE' ? { candidateId: session.id } : {};
  const applications = await prisma.application.findMany({ where, include: { job: true }, orderBy: { appliedAt: 'desc' } });
  console.info('Applications fetched', { role: session.role, userId: session.id, count: applications.length });
  return NextResponse.json({ applications: applications.map(toApplicationView) });
}
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== 'CANDIDATE') return NextResponse.json({ error: 'Candidate authentication is required.' }, { status: 401 });
  const body = await request.json();
  if (!body?.jobId || !body?.candidateName || !body?.analysis) return NextResponse.json({ error: 'Invalid application.' }, { status: 400 });
  const existing = await prisma.application.findFirst({ where: { jobId: body.jobId, candidateId: session.id } });
  if (existing) return NextResponse.json({ application: toApplicationView(existing) });
  const application = await prisma.application.create({ data: { jobId: body.jobId, candidateId: session.id, candidateName: body.candidateName, resumeName: body.resumeName, talentScore: body.talentScore, atsScore: body.atsScore, skills: JSON.stringify(body.skills || []), analysis: JSON.stringify(body.analysis) }, include: { job: true } });
  console.info('Application created', { applicationId: application.id, candidateId: session.id, jobId: application.jobId });
  return NextResponse.json({ application: toApplicationView(application) });
}
