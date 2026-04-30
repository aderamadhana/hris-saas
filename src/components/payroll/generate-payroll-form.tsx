"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  DollarSign,
  Loader2,
  Square,
  Users,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface PayrollEmployee {
  id: string;
  firstName: string | null;
  lastName: string | null;
  employeeId: string;
  position: string | null;
  baseSalary: number;
  department?: string | null;
}

interface GeneratePayrollFormProps {
  employees?: PayrollEmployee[];
  defaultMonth?: number;
  defaultYear?: number;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEmployeeName(employee: PayrollEmployee) {
  return (
    `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
    "Unnamed employee"
  );
}

export function GeneratePayrollForm({
  employees = [],
  defaultMonth,
  defaultYear,
}: GeneratePayrollFormProps) {
  const router = useRouter();
  const now = new Date();

  const safeEmployees = Array.isArray(employees) ? employees : [];

  const initialMonth = String(defaultMonth ?? now.getMonth() + 1);
  const initialYear = String(defaultYear ?? now.getFullYear());

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(safeEmployees.map((employee) => employee.id)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const currentYear = now.getFullYear();

    return Array.from({ length: 5 }, (_, index) =>
      String(currentYear - 2 + index),
    );
  }, [now]);

  const selectedEmployees = useMemo(() => {
    return safeEmployees.filter((employee) => selected.has(employee.id));
  }, [safeEmployees, selected]);

  const totalBaseSalary = selectedEmployees.reduce(
    (sum, employee) => sum + employee.baseSalary,
    0,
  );

  const allSelected =
    safeEmployees.length > 0 && selected.size === safeEmployees.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }

    setSelected(new Set(safeEmployees.map((employee) => employee.id)));
  }

  function toggleEmployee(id: string) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function handleGenerate() {
    if (selected.size === 0) {
      setError("Please select at least one employee.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year),
          employeeIds: Array.from(selected),
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.error ?? "Failed to generate payroll.");
      }

      router.push("/payroll");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate payroll.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-950">Pay period</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select the month and year for payroll generation.
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-800">Month</Label>
            <Select
              value={month}
              onValueChange={setMonth}
              disabled={submitting}
            >
              <SelectTrigger className="h-10 focus:ring-[#0B5A43]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((monthName, index) => (
                  <SelectItem key={monthName} value={String(index + 1)}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-800">Year</Label>
            <Select value={year} onValueChange={setYear} disabled={submitting}>
              <SelectTrigger className="h-10 focus:ring-[#0B5A43]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Calendar className="mr-2 inline h-4 w-4 text-[#0B5A43]" />
          Generating payroll for{" "}
          <span className="font-semibold text-gray-950">
            {MONTHS[Number(month) - 1]} {year}
          </span>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-950">
              Select employees
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose employees to include in this payroll run.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            disabled={submitting || safeEmployees.length === 0}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#0B5A43] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {allSelected ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Deselect all
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                Select all ({safeEmployees.length})
              </>
            )}
          </button>
        </div>

        {safeEmployees.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-gray-800">
              No active employees
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Add active employees before generating payroll.
            </p>
          </div>
        ) : (
          <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
            {safeEmployees.map((employee) => (
              <label
                key={employee.id}
                className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-gray-50"
              >
                <Checkbox
                  checked={selected.has(employee.id)}
                  disabled={submitting}
                  onCheckedChange={() => toggleEmployee(employee.id)}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-950">
                    {getEmployeeName(employee)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {employee.employeeId}
                    {employee.position ? ` · ${employee.position}` : ""}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-medium text-gray-700">
                  {formatCurrency(employee.baseSalary)}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {selected.size > 0 && (
        <section className="border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-950">
            Generation summary
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SummaryRow
              icon={<Users className="h-4 w-4" />}
              label="Selected employees"
              value={String(selected.size)}
            />

            <SummaryRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Total base salary"
              value={formatCurrency(totalBaseSalary)}
            />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Final net salary will be calculated after attendance, overtime,
            BPJS, PPh21, and other deductions are processed.
          </p>
        </section>
      )}

      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/payroll")}
          disabled={submitting}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={submitting || selected.size === 0}
          className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating payroll
            </>
          ) : (
            <>
              Generate Payroll
              <span className="ml-1 text-white/80">({selected.size})</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-gray-500">
        <span className="text-[#0B5A43]">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-950">{value}</p>
    </div>
  );
}
