// src/app/api/employees/list/route.ts
// GET: Ambil daftar employee (untuk dropdown delegasi, dll)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const excludeSelf = searchParams.get("excludeSelf") === "true";
    const departmentId = searchParams.get("departmentId") || undefined;

    const where: any = {
      organizationId: currentEmployee.organizationId,
      status: "active",
    };

    if (excludeSelf) {
      where.id = { not: currentEmployee.id };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id:         true,
        firstName:  true,
        lastName:   true,
        employeeId: true,
        position:   true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: "asc" },
    });

    const data = employees.map((e) => ({
      id:         e.id,
      firstName:  e.firstName,
      lastName:   e.lastName,
      fullName:   `${e.firstName} ${e.lastName}`.trim(),
      employeeId: e.employeeId,
      position:   e.position,
      department: e.department?.name ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/employees/list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}