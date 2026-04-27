"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  position: z.string().min(2, "Position must be at least 2 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  departmentId: z.string().optional(),
  role: z.string().min(1, "Please select a role"),
  employmentType: z.string().min(1, "Please select an employment type"),
  baseSalary: z.coerce.number().min(0, "Salary must be a positive number"),
  joinDate: z.string().min(1, "Join date is required"),
  phoneNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Role Definitions ─────────────────────────────────────────────────────────
const ALL_ROLES = [
  {
    value: "employee",
    label: "Employee",
    description: "Regular staff — self-service access only",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Team lead — can approve leave for direct reports",
  },
  {
    value: "hr",
    label: "HR Manager",
    description: "HR team — full employee and payroll management",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "System admin — full access except billing",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Company owner — full access including billing",
  },
];

function getRolesForUser(currentUserRole: string) {
  const hierarchy = ["employee", "manager", "hr", "admin", "owner"];
  const currentIndex = hierarchy.indexOf(currentUserRole);
  // Can only assign roles up to and including own role
  return ALL_ROLES.filter((r) => hierarchy.indexOf(r.value) <= currentIndex);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Department {
  id: string;
  name: string;
}

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  employeeId: string;
  departmentId?: string;
  role: string;
  employmentType: string;
  baseSalary: number;
  joinDate: string;
  phoneNumber?: string;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  departments: Department[];
  employee?: EmployeeData;
  currentUserRole: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployeeForm({
  mode,
  departments,
  employee,
  currentUserRole,
}: EmployeeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const availableRoles = getRolesForUser(currentUserRole);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      email: employee?.email ?? "",
      position: employee?.position ?? "",
      employeeId: employee?.employeeId ?? "",
      departmentId: employee?.departmentId ?? "",
      role: employee?.role ?? "employee",
      employmentType: employee?.employmentType ?? "full-time",
      baseSalary: employee?.baseSalary ?? 0,
      joinDate: employee?.joinDate
        ? employee.joinDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      phoneNumber: employee?.phoneNumber ?? "",
    },
  });

  const selectedRole = watch("role");
  const selectedRoleDef = ALL_ROLES.find((r) => r.value === selectedRole);

  async function onSubmit(data: FormData) {
    setServerError(null);
    const url =
      mode === "create" ? "/api/employees" : `/api/employees/${employee?.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        departmentId: data.departmentId || null,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/dashboard/employees");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Personal Info ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name" error={errors.firstName?.message} required>
            <Input placeholder="John" {...register("firstName")} />
          </Field>
          <Field label="Last Name" error={errors.lastName?.message} required>
            <Input placeholder="Doe" {...register("lastName")} />
          </Field>
          <Field label="Email Address" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="john@company.com"
              {...register("email")}
              disabled={mode === "edit"}
            />
          </Field>
          <Field label="Phone Number" error={errors.phoneNumber?.message}>
            <Input placeholder="+1 555 000 0000" {...register("phoneNumber")} />
          </Field>
        </div>
      </section>

      {/* ── Employment Details ── */}
      <section className="space-y-4 border-t border-gray-100 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Employment Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Employee ID"
            error={errors.employeeId?.message}
            required
          >
            <Input placeholder="EMP001" {...register("employeeId")} />
          </Field>
          <Field
            label="Job Title / Position"
            error={errors.position?.message}
            required
          >
            <Input placeholder="Software Engineer" {...register("position")} />
          </Field>
          <Field label="Department" error={errors.departmentId?.message}>
            <Select
              value={watch("departmentId") ?? ""}
              onValueChange={(v) =>
                setValue("departmentId", v === "none" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Employment Type"
            error={errors.employmentType?.message}
            required
          >
            <Select
              value={watch("employmentType")}
              onValueChange={(v) => setValue("employmentType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-Time</SelectItem>
                <SelectItem value="part-time">Part-Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Join Date" error={errors.joinDate?.message} required>
            <Input type="date" {...register("joinDate")} />
          </Field>
          <Field
            label="Base Salary (IDR)"
            error={errors.baseSalary?.message}
            required
          >
            <Input
              type="number"
              placeholder="10000000"
              {...register("baseSalary")}
            />
          </Field>
        </div>
      </section>

      {/* ── Role ── */}
      <section className="space-y-4 border-t border-gray-100 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          System Role
        </h2>
        <Field label="Role" error={errors.role?.message} required>
          <Select
            value={selectedRole}
            onValueChange={(v) => setValue("role", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  <div className="flex flex-col py-0.5">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-gray-400">
                      {r.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {selectedRoleDef && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="font-medium">{selectedRoleDef.label}:</span>{" "}
            {selectedRoleDef.description}
          </div>
        )}

        {currentUserRole === "owner" && (
          <p className="text-xs text-gray-400">
            As the owner, you can assign any role including Administrator and
            Owner.
          </p>
        )}
      </section>

      {/* ── Error ── */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 border-t border-gray-100 pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 sm:flex-none sm:px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : mode === "create" ? (
            "Create Employee"
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-6"
          onClick={() => router.push("/dashboard/employees")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
