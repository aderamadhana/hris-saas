// app/api/leave/list/route.ts
// GET: Ambil semua leave request milik user yang sedang login.
// Dipakai oleh LeaveList component (tab "My Requests").

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const leaves = await prisma.leave.findMany({
      where: { employeeId: employee.id },
      include: {
        delegate: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = leaves.map((leave) => ({
      id: leave.id,
      leaveType: leave.leaveType,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      isPaid: leave.isPaid,
      currentApprovalLevel: leave.currentApprovalLevel,
      requiresApprovalLevels: leave.requiresApprovalLevels,
      rejectedReason: leave.rejectedReason ?? null,
      createdAt: leave.createdAt.toISOString(),
      delegate: leave.delegate ?? null,
      delegateNotes: leave.delegateNotes ?? null,
    }));

    return NextResponse.json({ success: true, leaves: serialized });
  } catch (error: any) {
    console.error("GET /api/leave/list error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leave list" },
      { status: 500 }
    );
  }
}