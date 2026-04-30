"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Loader2, Save } from "lucide-react";

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

const employeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phoneNumber: z.string().trim().optional(),
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  position: z.string().trim().min(2, "Position must be at least 2 characters"),
  departmentId: z.string().optional(),
  role: z.string().min(1, "Select a role"),
  employmentType: z.string().min(1, "Select an employment type"),
  baseSalary: z.number().min(0, "Salary must be 0 or higher"),
  joinDate: z.string().min(1, "Join date is required"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

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
  departmentId?: string | null;
  role: string;
  employmentType: string;
  baseSalary: number;
  joinDate: string;
  phoneNumber?: string | null;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  departments?: Department[];
  employee?: EmployeeData;
  currentUserRole: string;
}

const ROLE_OPTIONS = [
  {
    value: "employee",
    label: "Employee",
    description:
      "Self-service access for attendance, leave, profile, and payslip.",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Can manage team-related workflows such as leave approvals.",
  },
  {
    value: "hr",
    label: "HR",
    description:
      "Can manage employees, attendance, leave, payroll, and HR data.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Administrative access for organization operations.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Highest access level for the organization.",
  },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "freelance", label: "Freelance" },
];

function getRolesForUser(currentUserRole: string) {
  const hierarchy = ["employee", "manager", "hr", "admin", "owner"];
  const currentIndex = hierarchy.indexOf(currentUserRole);

  if (currentIndex < 0) {
    return ROLE_OPTIONS.filter((role) => role.value === "employee");
  }

  return ROLE_OPTIONS.filter(
    (role) => hierarchy.indexOf(role.value) <= currentIndex,
  );
}

function formatDateInput(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function EmployeeForm({
  mode,
  departments = [],
  employee,
  currentUserRole,
}: EmployeeFormProps) {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);

  const availableRoles = useMemo(
    () => getRolesForUser(currentUserRole),
    [currentUserRole],
  );

  const safeDepartments = Array.isArray(departments) ? departments : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      email: employee?.email ?? "",
      phoneNumber: employee?.phoneNumber ?? "",
      employeeId: employee?.employeeId ?? "",
      position: employee?.position ?? "",
      departmentId: employee?.departmentId ?? "",
      role: employee?.role ?? "employee",
      employmentType: employee?.employmentType ?? "full-time",
      baseSalary: employee?.baseSalary ?? 0,
      joinDate: formatDateInput(employee?.joinDate),
    },
  });

  const selectedRole = watch("role");
  const selectedRoleInfo =
    ROLE_OPTIONS.find((role) => role.value === selectedRole) ?? ROLE_OPTIONS[0];

  const selectedDepartmentId = watch("departmentId") ?? "";
  const selectedEmploymentType = watch("employmentType");

  async function onSubmit(data: EmployeeFormData) {
    setServerError(null);

    try {
      if (mode === "edit" && !employee?.id) {
        throw new Error("Employee ID is missing.");
      }

      const url =
        mode === "create" ? "/api/employees" : `/api/employees/${employee?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          departmentId: data.departmentId || null,
          phoneNumber: data.phoneNumber?.trim() || null,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.error ??
            `Failed to ${mode === "create" ? "create" : "update"} employee.`,
        );
      }

      router.push("/employees");
      router.refresh();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="flex gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      <FormSection
        title="Personal information"
        description="Basic identity and contact details for the employee."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName?.message} required>
            <Input
              placeholder="John"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("firstName")}
            />
          </Field>

          <Field label="Last name" error={errors.lastName?.message} required>
            <Input
              placeholder="Doe"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("lastName")}
            />
          </Field>

          <Field label="Email address" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="john@company.com"
              autoComplete="email"
              disabled={isSubmitting || mode === "edit"}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("email")}
            />
            {mode === "edit" && (
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed from this form.
              </p>
            )}
          </Field>

          <Field label="Phone number" error={errors.phoneNumber?.message}>
            <Input
              placeholder="+62 812 0000 0000"
              autoComplete="tel"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("phoneNumber")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Employment details"
        description="Work identity, department, job title, salary, and start date."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Employee ID"
            error={errors.employeeId?.message}
            required
          >
            <Input
              placeholder="EMP001"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("employeeId")}
            />
          </Field>

          <Field label="Position" error={errors.position?.message} required>
            <Input
              placeholder="Software Engineer"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("position")}
            />
          </Field>

          <Field label="Department" error={errors.departmentId?.message}>
            <Select
              value={selectedDepartmentId || "none"}
              disabled={isSubmitting}
              onValueChange={(value) =>
                setValue("departmentId", value === "none" ? "" : value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-10 focus:ring-[#0B5A43]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {safeDepartments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {safeDepartments.length === 0 && (
              <p className="mt-1 text-xs text-[#7A5A00]">
                No department has been created yet.
              </p>
            )}
          </Field>

          <Field
            label="Employment type"
            error={errors.employmentType?.message}
            required
          >
            <Select
              value={selectedEmploymentType}
              disabled={isSubmitting}
              onValueChange={(value) =>
                setValue("employmentType", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-10 focus:ring-[#0B5A43]">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Join date" error={errors.joinDate?.message} required>
            <Input
              type="date"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("joinDate")}
            />
          </Field>

          <Field
            label="Base salary"
            error={errors.baseSalary?.message}
            required
          >
            <Input
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              disabled={isSubmitting}
              className="h-10 focus-visible:ring-[#0B5A43]"
              {...register("baseSalary", {
                setValueAs: (value) => {
                  if (value === "" || value === null || value === undefined)
                    return 0;

                  const parsed = Number(value);
                  return Number.isFinite(parsed) ? parsed : 0;
                },
              })}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Access role"
        description="Choose what this employee can access in the system."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Field label="Role" error={errors.role?.message} required>
            <Select
              value={selectedRole}
              disabled={isSubmitting}
              onValueChange={(value) =>
                setValue("role", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-10 focus:ring-[#0B5A43]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="mt-1 text-xs text-gray-500">
              You can only assign roles up to your own access level.
            </p>
          </Field>

          <div className="border border-[#0B5A43]/20 bg-[#EAF5F0] p-3">
            <p className="text-sm font-semibold text-[#0B5A43]">
              {selectedRoleInfo.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              {selectedRoleInfo.description}
            </p>
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/employees">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating employee" : "Saving changes"}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Create employee" : "Save changes"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-800">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>

      {children}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
