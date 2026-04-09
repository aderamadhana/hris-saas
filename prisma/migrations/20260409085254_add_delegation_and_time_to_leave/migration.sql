-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'annual',
ADD COLUMN     "delegateNotes" TEXT,
ADD COLUMN     "delegateTo" TEXT,
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "totalHours" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Leave_leaveType_idx" ON "Leave"("leaveType");

-- CreateIndex
CREATE INDEX "Leave_delegateTo_idx" ON "Leave"("delegateTo");

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_delegateTo_fkey" FOREIGN KEY ("delegateTo") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
