// src/components/employees/employee-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface Department {
  id: string;
  name: string;
}
interface EmployeeFormProps {
  departments: Department[];
  mode: "create" | "edit";
  employee?: any;
  currentUserRole: string;
}

const ROLE_OPTIONS = [
  {
    value: "employee",
    label: "Employee",
    description: "Self-service access only",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Manage team and approve leave",
  },
  { value: "hr", label: "HR", description: "Manage employees & payroll" },
  {
    value: "admin",
    label: "Administrator",
    description: "Full access except billing",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Full access including billing",
  },
];

const ROLE_HINT: Record<string, string> = {
  owner: "As owner, you can assign any role.",
  admin: "As admin, you can assign all roles except Owner.",
  hr: "As HR, you can only assign Employee or Manager roles.",
};

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
];

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function EmployeeForm({
  departments,
  mode,
  employee,
  currentUserRole,
}: EmployeeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    employeeId: employee?.employeeId ?? "",
    phoneNumber: employee?.phoneNumber ?? "",
    position: employee?.position ?? "",
    departmentId: employee?.departmentId ?? "none",
    role: employee?.role ?? "employee",
    baseSalary: employee?.baseSalary?.toString() ?? "",
    dateOfBirth: employee?.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
      : "",
    address: employee?.address ?? "",
    joinDate: employee?.joinDate
      ? new Date(employee.joinDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    employmentType: employee?.employmentType ?? "full-time",
    status: employee?.status ?? "active",
  });

  const assignableRoles = ROLE_OPTIONS.filter((r) => {
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin") return r.value !== "owner";
    if (currentUserRole === "hr")
      return ["employee", "manager"].includes(r.value);
    return r.value === "employee";
  });

  const set = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email format";
    if (!form.employeeId.trim()) e.employeeId = "Employee ID is required";
    if (!form.position.trim()) e.position = "Position is required";
    if (!form.joinDate) e.joinDate = "Join date is required";
    if (!form.baseSalary) e.baseSalary = "Base salary is required";
    else if (isNaN(Number(form.baseSalary)) || Number(form.baseSalary) <= 0)
      e.baseSalary = "Base salary must be a positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/employees" : `/api/employees/${employee.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            departmentId:
              form.departmentId === "none" ? null : form.departmentId,
            baseSalary: Number(form.baseSalary),
            dateOfBirth: form.dateOfBirth || null,
            phoneNumber: form.phoneNumber || null,
            address: form.address || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSubmitSuccess(true);
      setTimeout(() => router.push("/employees"), 1200);
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <p className="text-lg font-semibold text-gray-900">
          Employee successfully {mode === "create" ? "created" : "updated"}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Redirecting to employee list...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Personal Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b pb-2">
          Personal Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required error={errors.firstName}>
            <Input
              name="firstName"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              disabled={isLoading}
              className={errors.firstName ? "border-red-500" : ""}
              placeholder="John"
            />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <Input
              name="lastName"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              disabled={isLoading}
              className={errors.lastName ? "border-red-500" : ""}
              placeholder="Doe"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            required
            error={errors.email}
            hint={
              mode === "edit"
                ? "Email cannot be changed after creation."
                : undefined
            }
          >
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={isLoading || mode === "edit"}
              className={errors.email ? "border-red-500" : ""}
              placeholder="john@company.com"
            />
          </Field>
          <Field label="Phone Number">
            <Input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              disabled={isLoading}
              placeholder="+62 812 3456 7890"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of Birth">
            <Input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field label="Address">
            <Input
              name="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              disabled={isLoading}
              placeholder="123 Main St, City"
            />
          </Field>
        </div>
      </section>

      {/* Employment Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b pb-2">
          Employment Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Employee ID"
            required
            error={errors.employeeId}
            hint={
              mode === "edit"
                ? "Employee ID cannot be changed."
                : "Example: EMP001, HRD002"
            }
          >
            <Input
              name="employeeId"
              value={form.employeeId}
              onChange={(e) => set("employeeId", e.target.value)}
              disabled={isLoading || mode === "edit"}
              className={errors.employeeId ? "border-red-500" : ""}
              placeholder="EMP001"
            />
          </Field>
          <Field label="Position" required error={errors.position}>
            <Input
              name="position"
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              disabled={isLoading}
              className={errors.position ? "border-red-500" : ""}
              placeholder="Software Engineer"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department">
            <Select
              value={form.departmentId}
              onValueChange={(v) => set("departmentId", v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No Department —</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Role" required hint={ROLE_HINT[currentUserRole]}>
            <Select
              value={form.role}
              onValueChange={(v) => set("role", v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="font-medium">{r.label}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      — {r.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Join Date" required error={errors.joinDate}>
            <Input
              name="joinDate"
              type="date"
              value={form.joinDate}
              onChange={(e) => set("joinDate", e.target.value)}
              disabled={isLoading}
              className={errors.joinDate ? "border-red-500" : ""}
            />
          </Field>
          <Field label="Employment Type">
            <Select
              value={form.employmentType}
              onValueChange={(v) => set("employmentType", v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field
          label="Base Salary (IDR)"
          required
          error={errors.baseSalary}
          hint="Enter numbers only without separators. Example: 10000000 = Rp 10,000,000"
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
              Rp
            </span>
            <Input
              name="baseSalary"
              type="number"
              value={form.baseSalary}
              onChange={(e) => set("baseSalary", e.target.value)}
              disabled={isLoading}
              className={`pl-9 ${errors.baseSalary ? "border-red-500" : ""}`}
              placeholder="10000000"
              min={0}
            />
          </div>
        </Field>
      </section>

      {/* Employment Status (edit only) */}
      {mode === "edit" && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b pb-2">
            Employment Status
          </h3>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </section>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={isLoading} className="min-w-[160px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Saving..." : "Updating..."}
            </>
          ) : mode === "create" ? (
            "Add Employee"
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/employees")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
