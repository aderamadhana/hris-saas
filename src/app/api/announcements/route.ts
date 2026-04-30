// src/app/api/announcements/route.ts

import { NextRequest, NextResponse } from "next/server";

import prisma from "@/src/lib/prisma";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

type UserRole = "employee" | "manager" | "hr" | "admin" | "owner";

const VIEW_ALL_ROLES: UserRole[] = ["owner", "admin", "hr"];
const CREATE_ROLES: UserRole[] = ["owner", "admin", "hr", "manager"];

function normalizeTargetRoles(value: unknown) {
  if (Array.isArray(value)) {
    const roles = value
      .map((role) => String(role).trim())
      .filter(Boolean);

    return roles.length > 0 ? roles.join(",") : "all";
  }

  if (typeof value === "string") {
    const cleaned = value.trim();
    return cleaned || "all";
  }

  return "all";
}

function canViewByRole(targetRoles: string | null, employeeRole: string) {
  if (!targetRoles || targetRoles === "all") {
    return true;
  }

  const roles = targetRoles
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.includes(employeeRole)) {
    return true;
  }

  // Support user-friendly role groups from the UI.
  if (
    roles.includes("manager") &&
    ["manager", "hr", "admin", "owner"].includes(employeeRole)
  ) {
    return true;
  }

  if (
    roles.includes("hr") &&
    ["hr", "admin", "owner"].includes(employeeRole)
  ) {
    return true;
  }

  if (roles.includes("admin") && ["admin", "owner"].includes(employeeRole)) {
    return true;
  }

  return false;
}

function isAnnouncementVisibleToEmployee({
  announcement,
  employee,
  canViewAll,
}: {
  announcement: {
    authorId: string;
    targetRoles: string | null;
    targetDepartmentId: string | null;
  };
  employee: {
    id: string;
    role: string;
    departmentId: string | null;
  };
  canViewAll: boolean;
}) {
  if (canViewAll) {
    return true;
  }

  // Managers can always see announcements they created, including drafts.
  if (announcement.authorId === employee.id) {
    return true;
  }

  if (!canViewByRole(announcement.targetRoles, employee.role)) {
    return false;
  }

  if (
    announcement.targetDepartmentId &&
    announcement.targetDepartmentId !== employee.departmentId
  ) {
    return false;
  }

  return true;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        authId: user.id,
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        departmentId: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const canViewAll = VIEW_ALL_ROLES.includes(employee.role as UserRole);
    const canCreate = CREATE_ROLES.includes(employee.role as UserRole);

    const activeAnnouncementFilter = {
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    };

    const where = canViewAll
      ? {
          organizationId: employee.organizationId,
        }
      : canCreate
        ? {
            organizationId: employee.organizationId,
            OR: [
              activeAnnouncementFilter,
              {
                authorId: employee.id,
              },
            ],
          }
        : {
            organizationId: employee.organizationId,
            ...activeAnnouncementFilter,
          };

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        targetDepartment: {
          select: {
            name: true,
          },
        },
        reads: {
          where: {
            employeeId: employee.id,
          },
          select: {
            readAt: true,
          },
        },
        _count: {
          select: {
            reads: true,
          },
        },
      },
      orderBy: [
        {
          isPinned: "desc",
        },
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    const filteredAnnouncements = announcements
      .filter((announcement) =>
        isAnnouncementVisibleToEmployee({
          announcement,
          employee,
          canViewAll,
        }),
      )
      .map((announcement) => {
        const { reads, ...announcementData } = announcement;

        return {
          ...announcementData,
          isRead: reads.length > 0,
          readAt: reads[0]?.readAt ?? null,
        };
      });

    return NextResponse.json({
      success: true,
      data: filteredAnnouncements,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load announcements.",
      },
      { status: 500 },
    );
  }
}

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
      where: {
        authId: user.id,
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    if (!CREATE_ROLES.includes(employee.role as UserRole)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      title,
      content,
      type,
      isPinned,
      targetRoles,
      targetDepartmentId,
      expiresAt,
      attachmentUrl,
      attachmentName,
      isPublished,
    } = body;

    const cleanedTitle = typeof title === "string" ? title.trim() : "";
    const cleanedContent = typeof content === "string" ? content.trim() : "";

    if (!cleanedTitle || !cleanedContent) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 },
      );
    }

    // Default harus true supaya announcement langsung muncul.
    // Kalau mau draft, frontend harus explicit kirim isPublished: false.
    const shouldPublish = isPublished !== false;

    const announcement = await prisma.announcement.create({
      data: {
        organizationId: employee.organizationId,
        authorId: employee.id,
        title: cleanedTitle,
        content: cleanedContent,
        type: typeof type === "string" && type.trim() ? type.trim() : "info",
        isPinned: Boolean(isPinned),
        isPublished: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
        targetRoles: normalizeTargetRoles(targetRoles),
        targetDepartmentId:
          typeof targetDepartmentId === "string" && targetDepartmentId.trim()
            ? targetDepartmentId.trim()
            : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachmentUrl:
          typeof attachmentUrl === "string" && attachmentUrl.trim()
            ? attachmentUrl.trim()
            : null,
        attachmentName:
          typeof attachmentName === "string" && attachmentName.trim()
            ? attachmentName.trim()
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create announcement.",
      },
      { status: 500 },
    );
  }
}