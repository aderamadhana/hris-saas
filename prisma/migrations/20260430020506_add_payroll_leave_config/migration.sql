-- CreateTable
CREATE TABLE "PayrollConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bpjsKesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bpjsKesEmployee" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "bpjsKesEmployer" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "bpjsKesMaxSalary" DOUBLE PRECISION,
    "bpjsTkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bpjsTkJHT" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "bpjsTkJHTEmployer" DOUBLE PRECISION NOT NULL DEFAULT 3.7,
    "bpjsTkJP" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "bpjsTkJPEmployer" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "bpjsTkJKK" DOUBLE PRECISION NOT NULL DEFAULT 0.24,
    "bpjsTkJKM" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "bpjsTkMaxSalary" DOUBLE PRECISION,
    "pph21Enabled" BOOLEAN NOT NULL DEFAULT false,
    "pph21Method" TEXT NOT NULL DEFAULT 'gross',
    "pph21PTKP" DOUBLE PRECISION NOT NULL DEFAULT 54000000,
    "ptkpStatus" TEXT NOT NULL DEFAULT 'TK/0',
    "lateDeductEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    "lateDeductMethod" TEXT NOT NULL DEFAULT 'minute_salary',
    "lateDeductAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateDeductPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earlyLeaveDeductEnabled" BOOLEAN NOT NULL DEFAULT false,
    "earlyLeaveDeductMethod" TEXT NOT NULL DEFAULT 'minute_salary',
    "earlyLeaveDeductAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earlyLeaveDeductPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "absentDeductEnabled" BOOLEAN NOT NULL DEFAULT false,
    "absentDeductMethod" TEXT NOT NULL DEFAULT 'daily_salary',
    "absentDeductAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "overtimeRate1" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "overtimeRate2" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "overtimeRateHoliday" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "overtimeHourlyBasis" INTEGER NOT NULL DEFAULT 173,
    "customAllowances" TEXT NOT NULL DEFAULT '[]',
    "customDeductions" TEXT NOT NULL DEFAULT '[]',
    "payrollDate" INTEGER NOT NULL DEFAULT 25,
    "cutoffDate" INTEGER NOT NULL DEFAULT 20,
    "salaryType" TEXT NOT NULL DEFAULT 'monthly',
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicyConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customName" TEXT,
    "maxDaysOverride" INTEGER,
    "isPaidOverride" BOOLEAN,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "canCarryForward" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForward" INTEGER,
    "countWeekend" BOOLEAN NOT NULL DEFAULT false,
    "requiresDelegation" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollConfig_organizationId_key" ON "PayrollConfig"("organizationId");

-- CreateIndex
CREATE INDEX "LeavePolicyConfig_organizationId_idx" ON "LeavePolicyConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicyConfig_organizationId_leaveTypeId_key" ON "LeavePolicyConfig"("organizationId", "leaveTypeId");

-- AddForeignKey
ALTER TABLE "PayrollConfig" ADD CONSTRAINT "PayrollConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicyConfig" ADD CONSTRAINT "LeavePolicyConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
