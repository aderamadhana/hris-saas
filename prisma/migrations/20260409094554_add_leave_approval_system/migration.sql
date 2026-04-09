/*
  Warnings:

  - You are about to drop the column `annualLeaveQuota` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `sickLeaveQuota` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "managerId" TEXT;

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "currentApprovalLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requiresApprovalLevels" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "annualLeaveQuota",
DROP COLUMN "sickLeaveQuota",
ADD COLUMN     "autoApproveBelow" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leaveApprovalLevels" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requireHrApprovalAbove" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "LeaveApproval" (
    "id" TEXT NOT NULL,
    "leaveId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveApproval_leaveId_idx" ON "LeaveApproval"("leaveId");

-- CreateIndex
CREATE INDEX "LeaveApproval_approverId_idx" ON "LeaveApproval"("approverId");

-- CreateIndex
CREATE INDEX "LeaveApproval_status_idx" ON "LeaveApproval"("status");

-- CreateIndex
CREATE INDEX "LeaveApproval_action_idx" ON "LeaveApproval"("action");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- CreateIndex
CREATE INDEX "Leave_startDate_endDate_idx" ON "Leave"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "Leave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
