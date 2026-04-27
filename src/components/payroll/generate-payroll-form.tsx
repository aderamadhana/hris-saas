"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  Users,
  DollarSign,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface EmployeeSummary {
  id: string;
  name: string;
  position: string;
  department?: string;
  baseSalary: number;
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

export function GeneratePayrollForm() {
  const router = useRouter();
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) =>
    String(now.getFullYear() - 2 + i),
  );

  useEffect(() => {
    fetch("/api/employees/list")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setEmployees(data.employees ?? []);
          setSelected(
            new Set((data.employees ?? []).map((e: EmployeeSummary) => e.id)),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleAll() {
    if (selected.size === employees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(employees.map((e) => e.id)));
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  const totalBaseSalary = employees
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + e.baseSalary, 0);

  async function handleGenerate() {
    if (selected.size === 0) {
      setError("Please select at least one employee.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year),
          employeeIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate payroll");
      router.push("/payroll");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Pay Period ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Pay Period
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Calendar className="mr-2 inline h-4 w-4" />
          Generating payroll for{" "}
          <strong>
            {MONTHS[Number(month) - 1]} {year}
          </strong>
        </div>
      </section>

      {/* ── Employee Selection ── */}
      <section className="space-y-4 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Select Employees
          </h2>
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {selected.size === employees.length ? (
              <>
                <CheckSquare className="h-4 w-4" /> Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4" /> Select All ({employees.length})
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
            {employees.map((emp) => (
              <label
                key={emp.id}
                className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={selected.has(emp.id)}
                  onCheckedChange={() => toggle(emp.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-400">
                    {emp.position}
                    {emp.department ? ` · ${emp.department}` : ""}
                  </p>
                </div>
                <span className="text-sm font-mono text-gray-600 flex-shrink-0">
                  {formatCurrency(emp.baseSalary)}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* ── Summary ── */}
      {selected.size > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Users className="h-4 w-4" />
              Selected employees
            </span>
            <span className="font-semibold text-gray-900">{selected.size}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <DollarSign className="h-4 w-4" />
              Total base salary
            </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(totalBaseSalary)}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Final net amounts will be calculated after deductions (BPJS, PPh21).
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Action ── */}
      <div className="flex gap-3 border-t border-gray-100 pt-6">
        <Button
          onClick={handleGenerate}
          disabled={submitting || selected.size === 0}
          className="h-11 flex-1 sm:flex-none sm:px-8"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            `Generate Payroll for ${selected.size} Employee${selected.size !== 1 ? "s" : ""}`
          )}
        </Button>
        <Button
          variant="outline"
          className="h-11 px-6"
          onClick={() => router.push("/payroll")}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
