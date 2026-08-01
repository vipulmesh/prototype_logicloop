-- Application status is scoped to an individual candidate's application.
ALTER TABLE "Application" ADD COLUMN "candidateId" TEXT;
CREATE INDEX "Application_candidateId_idx" ON "Application"("candidateId");
