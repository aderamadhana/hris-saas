// src/app/api/announcements/[id]/route.ts
// DELETE /api/announcements/[id] — hapus satu announcement

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

const DELETE_ROLES = ["owner", "admin", "hr", "manager"];

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (!DELETE_ROLES.includes(employee.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Cari announcement — pastikan milik org yang sama
    const announcement = await prisma.announcement.findFirst({
      where: {
        id,
        organizationId: employee.organizationId,
      },
      select: { id: true, authorId: true },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Manager hanya bisa hapus miliknya sendiri
    // HR/Admin/Owner bisa hapus semua
    const canDeleteAll = ["owner", "admin", "hr"].includes(employee.role);
    if (!canDeleteAll && announcement.authorId !== employee.id) {
      return NextResponse.json(
        { error: "You can only delete your own announcements" },
        { status: 403 }
      );
    }

    // Hapus reads dulu (cascade tidak selalu reliable di semua setup)
    await prisma.announcementRead.deleteMany({
      where: { announcementId: id },
    });

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/announcements/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete announcement.",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/announcements/[id] — update (pin, publish, dll) — opsional
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (!["owner", "admin", "hr"].includes(employee.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const announcement = await prisma.announcement.findFirst({
      where: { id, organizationId: employee.organizationId },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isPinned, isPublished, expiresAt } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof isPinned === "boolean") updateData.isPinned = isPinned;
    if (typeof isPublished === "boolean") {
      updateData.isPublished = isPublished;
      if (isPublished && !announcement.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/announcements/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update announcement.",
      },
      { status: 500 }
    );
  }
}