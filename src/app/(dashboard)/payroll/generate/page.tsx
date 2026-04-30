import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Calculator, Info } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { GeneratePayrollForm } from "@/src/components/payroll/generate-payroll-form";
import { getCurrentPeriod, getMonthName } from "@/src/lib/payroll/calculations";

export const dynamic = "force-dynamic";

export default async function GeneratePayrollPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  if (!["hr", "admin", "owner"].includes(currentEmployee.role)) {
    redirect("/payroll");
  }

  const employees = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      status: "active",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      position: true,
      baseSalary: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const currentPeriod = getCurrentPeriod();

  const existingPayroll = await prisma.payroll.findFirst({
    where: {
      organizationId: currentEmployee.organizationId,
      month: currentPeriod.month,
      year: currentPeriod.year,
    },
  });

  const employeeOptions = employees.map((employee) => ({
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    employeeId: employee.employeeId,
    position: employee.position,
    baseSalary: employee.baseSalary.toNumber(),
  }));

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <Calculator className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Generate Payroll
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Generate payroll for selected employees and payroll period.
              </p>
            </div>
          </div>

          <Link href="/payroll">
            <Button
              variant="outline"
              className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to payroll
            </Button>
          </Link>
        </div>
      </header>

      {existingPayroll && (
        <section className="border border-[#F7A81B]/40 bg-[#FFF4D9] p-4">
          <p className="text-sm font-semibold text-[#0B5A43]">
            Payroll already exists
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#7A5A00]">
            Payroll for {getMonthName(currentPeriod.month)} {currentPeriod.year}{" "}
            already exists. You can generate for a different period or selected
            employees only.
          </p>
        </section>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Payroll generation settings
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Select the payroll period and employees before generating payroll.
          </p>
        </div>

        <div className="p-5">
          <GeneratePayrollForm
            employees={employeeOptions}
            defaultMonth={currentPeriod.month}
            defaultYear={currentPeriod.year}
          />
        </div>
      </section>

      <section className="border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]">
            <Info className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-950">
              How payroll generation works
            </h2>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-600">
              <li>
                Payroll is calculated from employee salary and attendance data.
              </li>
              <li>
                Overtime, absence, late days, and deductions are included.
              </li>
              <li>
                BPJS and PPh21 deductions are calculated during generation.
              </li>
              <li>
                Allowances, bonuses, and deductions can be edited afterward.
              </li>
              <li>Payroll should be reviewed before approval and payment.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
