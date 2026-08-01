import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toApplicationView } from '@/lib/jobs';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== 'RECRUITER') return NextResponse.json({ error: 'Recruiter authentication is required.' }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  if (!['Pending', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'].includes(status)) return NextResponse.json({ error: 'Invalid application status.' }, { status: 400 });
  const application = await prisma.application.update({ where: { id }, data: { status }, include: { job: true } });
  console.info('Application status updated', { applicationId: id, candidateId: application.candidateId, status, recruiterId: session.id });
  return NextResponse.json({ application: toApplicationView(application) });
}
