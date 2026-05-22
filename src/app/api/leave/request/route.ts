// app/api/leave/request/route.ts
// POST: Submit pengajuan cuti baru.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
      select: {
        id: true,
        organizationId: true,
        managerId: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const leaveTypeId = formData.get("leaveTypeId");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const reason = formData.get("reason");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const totalHoursRaw = formData.get("totalHours");
    const delegateId = formData.get("delegateId");
    const delegateNotes = formData.get("delegateNotes");
    const attachment = formData.get("attachment");

    // ── Validasi field wajib ─────────────────────────────────────────────
    if (typeof leaveTypeId !== "string" || !leaveTypeId) {
      return NextResponse.json(
        { error: "Jenis cuti wajib dipilih" },
        { status: 400 }
      );
    }

    if (typeof startDate !== "string" || !startDate) {
      return NextResponse.json(
        { error: "Tanggal mulai wajib diisi" },
        { status: 400 }
      );
    }

    if (typeof endDate !== "string" || !endDate) {
      return NextResponse.json(
        { error: "Tanggal selesai wajib diisi" },
        { status: 400 }
      );
    }

    if (typeof reason !== "string" || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Alasan minimal 10 karakter" },
        { status: 400 }
      );
    }

    // ── Validasi tanggal ─────────────────────────────────────────────────
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    // TC-LV-025: Tanggal tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json(
        { error: "Tanggal mulai tidak boleh di masa lalu" },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: "Tanggal selesai harus sama atau setelah tanggal mulai" },
        { status: 400 }
      );
    }

    // ── TC-LV-026: Overlap check ─────────────────────────────────────────
    const overlap = await prisma.leave.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ["pending", "approved"] },
        OR: [
          {
            AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }],
          },
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }],
          },
          {
            AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
          },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json(
        {
          error:
            "Kamu sudah memiliki pengajuan cuti yang bertabrakan dengan tanggal ini",
        },
        { status: 400 }
      );
    }

    // ── Hitung durasi ────────────────────────────────────────────────────
    const leaveInfo = getLeaveInfo(leaveTypeId);

    // Cuti melahirkan & haji pakai calendar days (termasuk weekend)
    const days = leaveInfo.includeWeekends
      ? countCalendarDays(start, end)
      : countWorkingDays(start, end);

    const requiresApprovalLevels = days > 5 ? 2 : 1;

    const totalHours =
      typeof totalHoursRaw === "string" && totalHoursRaw.trim()
        ? parseFloat(totalHoursRaw)
        : null;

    if (attachment instanceof File && attachment.size > 0) {
      // TODO: upload ke Supabase Storage
      console.log("Attachment received:", attachment.name, attachment.size);
    }

    // ── Build data object dengan tipe Prisma yang benar ──────────────────
    // Gunakan Prisma.LeaveUncheckedCreateInput agar bisa pakai employeeId &
    // organizationId sebagai plain string tanpa nested connect.
    const data: Prisma.LeaveUncheckedCreateInput = {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      leaveType: leaveTypeId,
      startDate: start,
      endDate: end,
      days: Math.max(days, 1),
      reason: reason.trim(),
      status: "pending",
      isPaid: leaveInfo.isPaid,
      category: leaveInfo.category,
      currentApprovalLevel: 1,
      requiresApprovalLevels,
      // Optional fields — hanya di-set jika ada nilainya
      startTime:
        typeof startTime === "string" && startTime.trim()
          ? startTime
          : undefined,
      endTime:
        typeof endTime === "string" && endTime.trim() ? endTime : undefined,
      totalHours:
        typeof totalHours === "number" && !isNaN(totalHours)
          ? totalHours
          : undefined,
      delegateTo:
        typeof delegateId === "string" && delegateId.trim()
          ? delegateId
          : undefined,
      delegateNotes:
        typeof delegateNotes === "string" && delegateNotes.trim()
          ? delegateNotes
          : undefined,
    };

    // ── Buat leave record ────────────────────────────────────────────────
    const leave = await prisma.leave.create({ data });

    // ── Buat approval record untuk manager ──────────────────────────────
    if (employee.managerId) {
      await prisma.leaveApproval.create({
        data: {
          leaveId: leave.id,
          approverId: employee.managerId,
          level: 1,
          sequence: 1,
          status: "pending",
          action: "pending",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pengajuan cuti berhasil dikirim",
      leave: {
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        status: leave.status,
      },
    });
  } catch (error: any) {
    console.error("Submit leave request error:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Pengajuan cuti duplikat" },
        { status: 400 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Referensi tidak valid — periksa employee atau delegate ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Gagal mengirim pengajuan cuti" },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function countCalendarDays(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

interface LeaveInfo {
  category: string;
  isPaid: boolean;
  includeWeekends: boolean;
}

function getLeaveInfo(leaveTypeId: string): LeaveInfo {
  const map: Record<string, LeaveInfo> = {
    annual: { category: "annual", isPaid: true, includeWeekends: false },
    sick: { category: "health", isPaid: true, includeWeekends: true },
    maternity: { category: "maternity", isPaid: true, includeWeekends: true },
    marriage: { category: "special", isPaid: true, includeWeekends: false },
    child_marriage: {
      category: "special",
      isPaid: true,
      includeWeekends: false,
    },
    child_circumcision: {
      category: "special",
      isPaid: true,
      includeWeekends: false,
    },
    child_baptism: {
      category: "special",
      isPaid: true,
      includeWeekends: false,
    },
    paternity: { category: "special", isPaid: true, includeWeekends: false },
    family_death: {
      category: "special",
      isPaid: true,
      includeWeekends: false,
    },
    extended_family_death: {
      category: "special",
      isPaid: true,
      includeWeekends: false,
    },
    hajj: { category: "special", isPaid: false, includeWeekends: true },
    compensatory: { category: "work", isPaid: true, includeWeekends: false },
    business_trip_local: {
      category: "work",
      isPaid: true,
      includeWeekends: false,
    },
    business_trip_province: {
      category: "work",
      isPaid: true,
      includeWeekends: false,
    },
    out_of_office: { category: "work", isPaid: true, includeWeekends: false },
    wfh: { category: "work", isPaid: true, includeWeekends: false },
    wfa: { category: "work", isPaid: true, includeWeekends: false },
    unpaid: { category: "unpaid", isPaid: false, includeWeekends: false },
  };

  return (
    map[leaveTypeId] ?? {
      category: "annual",
      isPaid: true,
      includeWeekends: false,
    }
  );
}