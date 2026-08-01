import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (await prisma.hackathon.count() === 0) await prisma.hackathon.createMany({
  data: [
    { name: 'AI Innovation Hack 2026', team: 'Neural Knights', project: 'AutoDev: Self-healing Code', innovation: 96, technical: 92, business: 85, overall: 91, members: JSON.stringify(['Alice Chen', 'Bob Smith']) },
    { name: 'Global Fintech Challenge', team: 'BlockChain Bros', project: 'DeFi Micro-lending Platform', innovation: 88, technical: 85, business: 94, overall: 89, members: JSON.stringify(['Charlie Davis']) },
    { name: 'Web3 & Future Web', team: 'Quantum UX', project: 'Zero-latency UI Framework', innovation: 91, technical: 95, business: 78, overall: 88, members: JSON.stringify(['Diana Prince', 'Evan Wright']) },
  ],
});

if (await prisma.contributionAnalytics.count() === 0) await prisma.contributionAnalytics.create({
  data: { score: 88, projects: 12, contributions: 432, commits: 854, pullRequests: 89, recentActivity: JSON.stringify([
    { repo: 'frontend-monorepo', action: 'Merged PR #442', date: '2 days ago' },
    { repo: 'ui-components', action: 'Pushed 4 commits', date: '5 days ago' },
    { repo: 'backend-services', action: 'Opened PR #102', date: '1 week ago' },
  ]) },
});

await prisma.$disconnect();
