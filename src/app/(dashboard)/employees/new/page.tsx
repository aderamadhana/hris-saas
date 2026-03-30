import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmployeeForm } from "@/src/components/employees/employee-form";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    redirect("/login");
  }

  // Only HR, Admin, Owner can add employees
  if (!["hr", "admin", "owner"].includes(currentEmployee.role)) {
    redirect("/employees");
  }

  // Get departments for dropdown
  const departments = await prisma.department.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill in the information below to create a new employee
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            departments={departments}
            mode="create"
            currentUserRole={currentEmployee.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
