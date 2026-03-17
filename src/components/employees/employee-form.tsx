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
import { useToast } from "@/src/hooks/use-toast";
import { Loader2, Info } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  departments: Department[];
  mode: "create" | "edit";
  employee?: any;
  currentUserRole: string; // ✅ NEW: To determine who can assign roles
}

// ✅ Role options with descriptions
const ROLE_OPTIONS = [
  {
    value: "employee",
    label: "Employee",
    description: "Regular staff - Self-service only",
    badge: "Gray",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Team leader - Approve team leave",
    badge: "Blue",
  },
  {
    value: "hr",
    label: "HR Manager",
    description: "HR team - Manage employees & payroll",
    badge: "Purple",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "System admin - Full access except billing",
    badge: "Orange",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Company owner - Full access including billing",
    badge: "Red",
  },
];

export function EmployeeForm({
  departments,
  mode,
  employee,
  currentUserRole,
}: EmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    email: employee?.email || "",
    employeeId: employee?.employeeId || "",
    phoneNumber: employee?.phoneNumber || "",
    position: employee?.position || "",
    departmentId: employee?.departmentId || "no-department",
    role: employee?.role || "employee", // ✅ Default to employee
    baseSalary: employee?.baseSalary || "",
    dateOfBirth: employee?.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: employee?.gender || "",
    address: employee?.address || "",
    joinDate: employee?.joinDate
      ? new Date(employee.joinDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    employmentType: employee?.employmentType || "full-time",
    status: employee?.status || "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Determine which roles current user can assign
  const getAssignableRoles = () => {
    if (currentUserRole === "owner") {
      // Owner can assign any role
      return ROLE_OPTIONS;
    } else if (currentUserRole === "admin") {
      // Admin can assign all except owner
      return ROLE_OPTIONS.filter((r) => r.value !== "owner");
    } else if (currentUserRole === "hr") {
      // HR can assign employee, manager only
      return ROLE_OPTIONS.filter((r) =>
        ["employee", "manager"].includes(r.value),
      );
    }
    // Others cannot assign roles
    return ROLE_OPTIONS.filter((r) => r.value === "employee");
  };

  const assignableRoles = getAssignableRoles();

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }
    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    }
    if (!formData.baseSalary) {
      newErrors.baseSalary = "Base salary is required";
    } else if (
      isNaN(Number(formData.baseSalary)) ||
      Number(formData.baseSalary) <= 0
    ) {
      newErrors.baseSalary = "Base salary must be a positive number";
    }
    if (!formData.joinDate) {
      newErrors.joinDate = "Join date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const url =
        mode === "create" ? "/api/employees" : `/api/employees/${employee.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          departmentId:
            formData.departmentId === "no-department"
              ? null
              : formData.departmentId,
          baseSalary: Number(formData.baseSalary),
          dateOfBirth: formData.dateOfBirth || null,
          phoneNumber: formData.phoneNumber || null,
          address: formData.address || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} employee`);
      }

      toast({
        title: "Success",
        description: `Employee ${mode === "create" ? "created" : "updated"} successfully`,
      });

      router.push("/dashboard/employees");
      router.refresh();
    } catch (error: any) {
      console.error(`Error ${mode}ing employee:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} employee`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Basic Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || mode === "edit"}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
            {mode === "edit" && (
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Employment Details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Employee ID */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">
              Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              disabled={isLoading || mode === "edit"}
              className={errors.employeeId ? "border-red-500" : ""}
              placeholder="EMP001"
            />
            {errors.employeeId && (
              <p className="text-sm text-red-600">{errors.employeeId}</p>
            )}
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">
              Position <span className="text-red-500">*</span>
            </Label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.position ? "border-red-500" : ""}
              placeholder="Software Engineer"
            />
            {errors.position && (
              <p className="text-sm text-red-600">{errors.position}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) =>
                handleSelectChange("departmentId", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-department">No Department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ✅ ROLE SELECTOR - NEW! */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <span>{role.label}</span>
                      <span className="text-xs text-gray-500">
                        ({role.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5" />
              <span>
                {currentUserRole === "owner"
                  ? "As owner, you can assign any role"
                  : currentUserRole === "admin"
                    ? "As admin, you can assign all roles except owner"
                    : currentUserRole === "hr"
                      ? "As HR, you can assign employee or manager roles"
                      : "You can only assign employee role"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Join Date */}
          <div className="space-y-2">
            <Label htmlFor="joinDate">
              Join Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="joinDate"
              name="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.joinDate ? "border-red-500" : ""}
            />
            {errors.joinDate && (
              <p className="text-sm text-red-600">{errors.joinDate}</p>
            )}
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select
              value={formData.employmentType}
              onValueChange={(value) =>
                handleSelectChange("employmentType", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Base Salary */}
        <div className="space-y-2">
          <Label htmlFor="baseSalary">
            Base Salary (IDR) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="baseSalary"
            name="baseSalary"
            type="number"
            value={formData.baseSalary}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.baseSalary ? "border-red-500" : ""}
            placeholder="10000000"
          />
          {errors.baseSalary && (
            <p className="text-sm text-red-600">{errors.baseSalary}</p>
          )}
          <p className="text-xs text-gray-500">
            Enter amount without commas (e.g., 10000000 for Rp 10,000,000)
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Status (for edit mode) */}
      {mode === "edit" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Status</h3>
          <div className="space-y-2">
            <Label htmlFor="status">Employment Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Employee"
              : "Update Employee"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/employees")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
