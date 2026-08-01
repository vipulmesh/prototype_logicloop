import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toApplicationView } from '@/lib/jobs';
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const { status } = await request.json(); const application = await prisma.application.update({ where: { id }, data: { status }, include: { job: true } }); return NextResponse.json({ application: toApplicationView(application) }); }
