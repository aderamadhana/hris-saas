"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useToast } from "@/src/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    baseSalary: number;
  };
}

export function ProfileForm({ employee }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    phoneNumber: employee.phoneNumber || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (formData.phoneNumber && !/^[0-9+\-() ]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
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
    // Clear error for this field
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
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Redirect back to profile page
      router.push("/profile");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.firstName ? "border-red-500" : ""}
          placeholder="Enter your first name"
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
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.lastName ? "border-red-500" : ""}
          placeholder="Enter your last name"
        />
        {errors.lastName && (
          <p className="text-sm text-red-600">{errors.lastName}</p>
        )}
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={employee.email}
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">
          Email cannot be changed. Contact your administrator if needed.
        </p>
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.phoneNumber ? "border-red-500" : ""}
          placeholder="+62 812 3456 7890"
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-600">{errors.phoneNumber}</p>
        )}
        <p className="text-xs text-gray-500">
          Your contact number for company communications
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/profile")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>

      {/* Info Note */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Some information like position, department, and
          salary can only be updated by your HR administrator.
        </p>
      </div>
    </form>
  );
}
