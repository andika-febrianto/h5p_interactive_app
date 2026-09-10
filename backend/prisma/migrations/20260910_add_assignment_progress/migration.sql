-- CreateTable
CREATE TABLE "assignment_progress" (
    "assignmentId" TEXT NOT NULL,
    "frameSlug" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_progress_pkey" PRIMARY KEY ("assignmentId","frameSlug")
);

-- CreateIndex
CREATE INDEX "assignment_progress_assignmentId_idx" ON "assignment_progress"("assignmentId");

-- AddForeignKey
ALTER TABLE "assignment_progress" ADD CONSTRAINT "assignment_progress_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "parent_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
