"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import { useToast } from "@/src/hooks/use-toast";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { getMonthName, formatCurrency } from "@/src/lib/payroll/calculations";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  baseSalary: number;
}

interface GeneratePayrollFormProps {
  employees: Employee[];
  defaultMonth: number;
  defaultYear: number;
}

export function GeneratePayrollForm({
  employees,
  defaultMonth,
  defaultYear,
}: GeneratePayrollFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [selectAll, setSelectAll] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    employees.map((e) => e.id),
  );

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEmployees(employees.map((e) => e.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  // Handle individual employee selection
  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
      setSelectAll(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployees.length === 0) {
      toast({
        title: "No employees selected",
        description: "Please select at least one employee to generate payroll",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          year,
          employeeIds: selectAll ? undefined : selectedEmployees,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate payroll");
      }

      // Show success message with details
      const { results } = data;
      toast({
        title: "Payroll Generated Successfully",
        description: `Generated payroll for ${results.success} employees. ${
          results.failed > 0 ? `${results.failed} failed.` : ""
        }`,
      });

      // Show errors if any
      if (results.errors && results.errors.length > 0) {
        console.error("Payroll generation errors:", results.errors);
      }

      // Redirect to payroll list
      router.push(`/payroll?month=${month}&year=${year}`);
      router.refresh();
    } catch (error: any) {
      console.error("Generate payroll error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate payroll",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total base salary for selected employees
  const totalBaseSalary = employees
    .filter((e) => selectedEmployees.includes(e.id))
    .reduce((sum, e) => sum + e.baseSalary, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Period Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Pay Period</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Month */}
          <div className="space-y-2">
            <Label htmlFor="month">
              Month <span className="text-red-500">*</span>
            </Label>
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {getMonthName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year">
              Year <span className="text-red-500">*</span>
            </Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => defaultYear - 2 + i).map(
                  (y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Employees
          </h3>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              disabled={isLoading}
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({employees.length})
            </Label>
          </div>
        </div>

        {/* Employee List */}
        <div className="max-h-96 overflow-y-auto rounded-lg border">
          {employees.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                No active employees found
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50"
                >
                  <Checkbox
                    id={employee.id}
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={(checked) =>
                      handleEmployeeToggle(employee.id, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={employee.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {employee.employeeId} • {employee.position}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Base Salary</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(employee.baseSalary)}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Selected: {selectedEmployees.length} employees
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Total base salary: {formatCurrency(totalBaseSalary)}
              </p>
            </div>
            <div className="text-sm text-blue-800">
              Period: {getMonthName(month)} {year}
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {selectedEmployees.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">
              Important Notes
            </p>
            <ul className="mt-1 text-sm text-yellow-800 space-y-1">
              <li>
                • Payroll will be generated based on attendance data for this
                period
              </li>
              <li>
                • Duplicate payroll for same employee/period will be skipped
              </li>
              <li>• You can edit allowances and bonuses after generation</li>
            </ul>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading || selectedEmployees.length === 0}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? "Generating..."
            : `Generate Payroll for ${selectedEmployees.length} Employee${
                selectedEmployees.length !== 1 ? "s" : ""
              }`}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/payroll")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
