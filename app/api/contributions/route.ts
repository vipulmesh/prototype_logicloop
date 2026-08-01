import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const analytics = await prisma.contributionAnalytics.findFirst();
  return NextResponse.json({ analytics: analytics ? { ...analytics, recentActivity: JSON.parse(analytics.recentActivity) as unknown[] } : null });
}
