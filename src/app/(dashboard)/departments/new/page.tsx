// =====================================================================
// FILE 1: src/app/(dashboard)/departments/new/page.tsx
// =====================================================================
// Copy konten di bawah ke file tersebut

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DepartmentForm } from "@/src/components/departments/department-form";

export const dynamic = "force-dynamic";

export default async function NewDepartmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { organizationId: true, role: true },
  });
  if (!currentEmployee) redirect("/login");

  if (!["owner", "admin", "hr"].includes(currentEmployee.role)) {
    redirect("/departments");
  }

  const managers = await prisma.employee.findMany({
    where: { organizationId: currentEmployee.organizationId, status: "active" },
    select: { id: true, firstName: true, lastName: true, position: true },
    orderBy: { firstName: "asc" },
  });

  const managerOptions = managers.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    position: m.position,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/departments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Departments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Department</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new department for your organization
        </p>
      </div>

      <div className="w-full rounded-xl border bg-white p-6 shadow-sm">
        <DepartmentForm managers={managerOptions} />
      </div>
    </div>
  );
}
