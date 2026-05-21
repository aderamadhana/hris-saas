// app/api/announcements/read/route.ts
// POST /api/announcements/read — mark satu announcement sebagai sudah dibaca

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId || typeof announcementId !== "string") {
      return NextResponse.json(
        { error: "announcementId is required" },
        { status: 400 }
      );
    }

    // Pastikan announcement ada dan milik organisasi yang sama
    const announcement = await prisma.announcement.findFirst({
      where: {
        id: announcementId,
        organizationId: employee.organizationId,
      },
      select: { id: true },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Upsert — kalau sudah ada record read, tidak duplikat
    await prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId: employee.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        announcementId,
        employeeId: employee.id,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST /api/announcements/read error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark announcement as read.",
      },
      { status: 500 }
    );
  }
}