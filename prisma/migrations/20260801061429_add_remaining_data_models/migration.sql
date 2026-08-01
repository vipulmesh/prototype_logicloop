-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "innovation" INTEGER NOT NULL,
    "technical" INTEGER NOT NULL,
    "business" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "members" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContributionAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" INTEGER NOT NULL,
    "projects" INTEGER NOT NULL,
    "contributions" INTEGER NOT NULL,
    "commits" INTEGER NOT NULL,
    "pullRequests" INTEGER NOT NULL,
    "recentActivity" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
