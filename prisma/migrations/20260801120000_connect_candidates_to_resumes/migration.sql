-- Candidate profiles need a stable identity and a relation to their uploaded resumes.
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "profilePhoto" TEXT;
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'RECRUITER';
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "Resume" ADD COLUMN "userId" TEXT;
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");
