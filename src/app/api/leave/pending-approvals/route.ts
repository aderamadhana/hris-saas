// src/app/api/leave/pending-approvals/route.ts
// GET: Ambil semua leave yang pending untuk di-approve oleh user yang login

import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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

    if (!["manager", "hr", "admin", "owner"].includes(currentEmployee.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const isHRAdmin = ["hr", "admin", "owner"].includes(currentEmployee.role);

    // ── Build where clause berdasarkan role ───────────────────────────────
    // Manager: lihat leave dari subordinates (managerId = currentEmployee.id)
    // HR/Admin/Owner: lihat semua leave pending di organisasi
    let leaveWhere: any = {
      organizationId: currentEmployee.organizationId,
      status: "pending",
    };

    if (!isHRAdmin) {
      // Manager: hanya lihat leave dari tim langsung
      const subordinateIds = await prisma.employee
        .findMany({
          where: { managerId: currentEmployee.id, status: "active" },
          select: { id: true },
        })
        .then((list) => list.map((e) => e.id));

      if (subordinateIds.length === 0) {
        return NextResponse.json({ success: true, leaves: [] });
      }

      leaveWhere.employeeId = { in: subordinateIds };
      leaveWhere.currentApprovalLevel = 1; // Manager hanya approve level 1
    } else {
      // HR/Admin/Owner: bisa approve semua level
      // Tapi HR khusus level 2 (setelah manager sudah approve)
      // Admin/Owner bisa approve semua level
    }

    const leaves = await prisma.leave.findMany({
      where: leaveWhere,
      include: {
        employee: {
          select: {
            id:         true,
            firstName:  true,
            lastName:   true,
            employeeId: true,
            position:   true,
            department: { select: { name: true } },
          },
        },
        approvals: {
          orderBy: { sequence: "asc" },
          select: {
            id:         true,
            approverId: true,
            action:     true,
            status:     true,
            comments:   true,
            level:      true,
            actionDate: true,
          },
        },
        delegate: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Serialize dates
    const serialized = leaves.map((leave) => ({
      id:                     leave.id,
      leaveType:              leave.leaveType,
      startDate:              leave.startDate.toISOString(),
      endDate:                leave.endDate.toISOString(),
      days:                   leave.days,
      reason:                 leave.reason,
      status:                 leave.status,
      isPaid:                 leave.isPaid,
      currentApprovalLevel:   leave.currentApprovalLevel,
      requiresApprovalLevels: leave.requiresApprovalLevels,
      delegateTo:             leave.delegateTo,
      delegateNotes:          leave.delegateNotes,
      employee:               leave.employee,
      delegate:               leave.delegate,
      approvals:              leave.approvals.map((a) => ({
        ...a,
        actionDate: a.actionDate.toISOString(),
      })),
    }));

    return NextResponse.json({ success: true, leaves: serialized });
  } catch (error: any) {
    console.error("GET /api/leave/pending-approvals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}