/*
  Warnings:

  - You are about to drop the column `dueDate` on the `GoalTracking` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `GoalTracking` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `communicationScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `goals` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `initiativeScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `overallScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerNotes` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `selfAssessment` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `selfScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `teamworkScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `workQualityScore` on the `PerformanceReview` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cycleId,revieweeId]` on the table `PerformanceReview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `revieweeId` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PerformanceReview" DROP CONSTRAINT "PerformanceReview_employeeId_fkey";

-- DropIndex
DROP INDEX "PerformanceReview_cycleId_employeeId_key";

-- DropIndex
DROP INDEX "PerformanceReview_employeeId_idx";

-- AlterTable
ALTER TABLE "GoalTracking" DROP COLUMN "dueDate",
DROP COLUMN "target",
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PerformanceReview" DROP COLUMN "attendanceScore",
DROP COLUMN "communicationScore",
DROP COLUMN "completedAt",
DROP COLUMN "employeeId",
DROP COLUMN "goals",
DROP COLUMN "initiativeScore",
DROP COLUMN "overallScore",
DROP COLUMN "reviewerNotes",
DROP COLUMN "selfAssessment",
DROP COLUMN "selfScore",
DROP COLUMN "teamworkScore",
DROP COLUMN "workQualityScore",
ADD COLUMN     "managerComments" TEXT,
ADD COLUMN     "managerRating" DOUBLE PRECISION,
ADD COLUMN     "overallRating" DOUBLE PRECISION,
ADD COLUMN     "revieweeId" TEXT NOT NULL,
ADD COLUMN     "selfComments" TEXT,
ADD COLUMN     "selfRating" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'pending_employee';

-- CreateIndex
CREATE INDEX "PerformanceReview_revieweeId_idx" ON "PerformanceReview"("revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReview_cycleId_revieweeId_key" ON "PerformanceReview"("cycleId", "revieweeId");

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
