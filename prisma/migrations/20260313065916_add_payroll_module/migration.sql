/*
  Warnings:

  - You are about to drop the column `insurance` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Payroll` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,month,year]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `month` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDeductions` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Payroll` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payroll_employeeId_period_key";

-- DropIndex
DROP INDEX "Payroll_period_idx";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "bpjsKesehatanRate" DECIMAL(5,2) NOT NULL DEFAULT 1,
ADD COLUMN     "bpjsKetenagakerjaanRate" DECIMAL(5,2) NOT NULL DEFAULT 2,
ADD COLUMN     "payrollDayOfMonth" INTEGER NOT NULL DEFAULT 25;

-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "insurance",
DROP COLUMN "paidAt",
DROP COLUMN "period",
DROP COLUMN "tax",
ADD COLUMN     "absentDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "bpjsKesehatan" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bpjsKetenagakerjaan" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "lateDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "overtimeHours" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pph21" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeductions" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "workDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "year" INTEGER NOT NULL,
ALTER COLUMN "baseSalary" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "allowances" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "overtime" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "bonus" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "otherDeductions" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "grossSalary" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "netSalary" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2),
    "percentage" DECIMAL(5,2),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryComponent_organizationId_idx" ON "SalaryComponent"("organizationId");

-- CreateIndex
CREATE INDEX "Payroll_month_year_idx" ON "Payroll"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_employeeId_month_year_key" ON "Payroll"("employeeId", "month", "year");

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
