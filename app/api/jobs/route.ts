import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toJobView } from '@/lib/jobs';

export async function GET() {
  return NextResponse.json({ jobs: (await prisma.job.findMany({ orderBy: { createdAt: 'desc' } })).map(toJobView) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.title || !body?.location || !body?.type || !body?.description) return NextResponse.json({ error: 'Invalid job.' }, { status: 400 });
  const job = await prisma.job.create({ data: {
    title: body.title, company: body.company || 'TalentAI Partner', location: body.location, type: body.type,
    salary: body.salary || 'Competitive', skills: JSON.stringify(String(body.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean)), description: body.description,
  } });
  return NextResponse.json({ job: toJobView(job) });
}
