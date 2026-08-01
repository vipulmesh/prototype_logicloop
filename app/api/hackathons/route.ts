import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const hackathons = await prisma.hackathon.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ hackathons: hackathons.map((hackathon) => ({ ...hackathon, members: JSON.parse(hackathon.members) as string[] })) });
}
