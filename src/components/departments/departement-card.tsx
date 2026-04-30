// src/components/departments/department-card.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Edit,
  MoreVertical,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { DeleteDepartmentDialog } from "./delete-department-dialog";

interface DepartmentCardProps {
  department: {
    id: string;
    name: string;
    description: string;
    managerName: string;
    managerEmail: string;
    employeeCount: number;
    totalEmployees: number;
  };
  canManage: boolean;
}

export function DepartmentCard({ department, canManage }: DepartmentCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const hasManager = department.managerName !== "No Manager";

  return (
    <>
      <article className="border border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-950">
                {department.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                {department.description || "No description provided."}
              </p>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => router.push(`/departments/${department.id}`)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/departments/${department.id}/edit`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-4 p-5">
          <div className="border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div
                className={
                  hasManager
                    ? "flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-sm font-semibold text-[#0B5A43]"
                    : "flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200 bg-white text-gray-400"
                }
              >
                {hasManager ? (
                  getInitials(department.managerName)
                ) : (
                  <UserCog className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Manager
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-gray-950">
                  {hasManager ? department.managerName : "No manager assigned"}
                </p>

                {hasManager && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {department.managerEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-gray-200">
            <div className="border-r border-gray-200 p-4">
              <div className="flex items-center gap-2 text-[#0B5A43]">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Active
                </span>
              </div>

              <p className="mt-2 text-2xl font-semibold text-gray-950">
                {department.employeeCount}
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Total
                </span>
              </div>

              <p className="mt-2 text-2xl font-semibold text-gray-950">
                {department.totalEmployees}
              </p>
            </div>
          </div>
        </div>
      </article>

      <DeleteDepartmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        department={{
          id: department.id,
          name: department.name,
          employeeCount: department.employeeCount,
        }}
      />
    </>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase() || "M";
}
