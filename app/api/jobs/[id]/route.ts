import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toJobView } from '@/lib/jobs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await request.json();
  const job = await prisma.job.update({ where: { id }, data: { title: body.title, location: body.location, type: body.type, description: body.description, skills: JSON.stringify(String(body.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean)) } });
  return NextResponse.json({ job: toJobView(job) });
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; await prisma.job.delete({ where: { id } }); return new NextResponse(null, { status: 204 }); }
