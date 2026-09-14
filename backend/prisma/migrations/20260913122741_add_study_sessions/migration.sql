-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "moduleId" TEXT,
    "frameSlug" TEXT,
    "activityType" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_sessions_childId_date_idx" ON "study_sessions"("childId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "study_sessions_childId_date_key" ON "study_sessions"("childId", "date");

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
