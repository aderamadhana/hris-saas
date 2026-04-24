// src/components/departments/department-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Manager {
  id: string;
  name: string;
  position: string;
}

interface DepartmentFormProps {
  managers: Manager[];
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    managerId?: string;
  };
  isEdit?: boolean;
}

export function DepartmentForm({
  managers,
  initialData,
  isEdit = false,
}: DepartmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      managerId: initialData?.managerId ?? "no-manager",
    },
  });

  const selectedManagerId = watch("managerId");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSubmitError("");
    try {
      // ✅ Correct API path with /dashboard prefix handled server-side
      const url = isEdit
        ? `/api/departments/${initialData?.id}`
        : "/api/departments";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          managerId: data.managerId === "no-manager" ? null : data.managerId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save department");

      setSubmitSuccess(true);
      setTimeout(() => router.push("/departments"), 1200);
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
          Department {isEdit ? "updated" : "created"} successfully
        </p>
        <p className="text-sm text-gray-400 mt-1">Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Department Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g. Engineering, Marketing, Finance"
          disabled={isLoading}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Brief description of this department..."
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Manager */}
      <div className="space-y-1.5">
        <Label>Department Manager</Label>
        <Select
          value={selectedManagerId}
          onValueChange={(v) => setValue("managerId", v)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a manager (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-manager">— No Manager —</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} — {m.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">
          Only active employees can be assigned as managers
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={isLoading} className="min-w-[160px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Update Department"
          ) : (
            "Create Department"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/departments")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
