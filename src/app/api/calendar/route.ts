// src/app/api/calendar/route.ts

import { NextRequest, NextResponse } from "next/server";

import prisma from "@/src/lib/prisma";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

type UserRole = "employee" | "manager" | "hr" | "admin" | "owner";

const MANAGE_ROLES: UserRole[] = ["owner", "admin", "hr"];

const EVENT_CREATE_ROLES: UserRole[] = ["owner", "admin", "hr", "manager"];

const NATIONAL_HOLIDAYS_2026 = [
  { title: "New Year's Day 2026", date: "2026-01-01" },
  { title: "Isra Miraj of Prophet Muhammad", date: "2026-01-16" },
  { title: "Chinese New Year 2577 Kongzili", date: "2026-02-17" },
  { title: "Day of Silence - Saka New Year 1948", date: "2026-03-19" },
  { title: "Eid al-Fitr 1447 H", date: "2026-03-21" },
  { title: "Eid al-Fitr 1447 H", date: "2026-03-22" },
  { title: "Good Friday", date: "2026-04-03" },
  { title: "Easter Sunday", date: "2026-04-05" },
  { title: "International Workers' Day", date: "2026-05-01" },
  { title: "Ascension Day of Jesus Christ", date: "2026-05-14" },
  { title: "Eid al-Adha 1447 H", date: "2026-05-27" },
  { title: "Vesak Day 2570 BE", date: "2026-05-31" },
  { title: "Pancasila Day", date: "2026-06-01" },
  { title: "Islamic New Year 1448 H", date: "2026-06-16" },
  { title: "Independence Day of Indonesia", date: "2026-08-17" },
  { title: "Birthday of Prophet Muhammad", date: "2026-08-25" },
  { title: "Christmas Day", date: "2026-12-25" },
];

function createDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getYearRange(year: number) {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
  };
}

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

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

function canViewEvent({
  event,
  employee,
}: {
  event: {
    targetRoles: string | null;
    targetDepartmentId: string | null;
  };
  employee: {
    role: string;
    departmentId: string | null;
  };
}) {
  if (!canViewByRole(event.targetRoles, employee.role)) {
    return false;
  }

  if (
    event.targetDepartmentId &&
    event.targetDepartmentId !== employee.departmentId
  ) {
    return false;
  }

  return true;
}

async function getCurrentEmployee() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      employee: null,
    };
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
    return {
      error: NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      ),
      employee: null,
    };
  }

  return {
    error: null,
    employee,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { error, employee } = await getCurrentEmployee();

    if (error || !employee) {
      return error;
    }

    const { searchParams } = new URL(request.url);

    const requestedYear = Number(searchParams.get("year"));
    const requestedMonth = Number(searchParams.get("month"));

    const year = Number.isFinite(requestedYear)
      ? requestedYear
      : new Date().getFullYear();

    const hasValidMonth =
      Number.isFinite(requestedMonth) &&
      requestedMonth >= 1 &&
      requestedMonth <= 12;

    const range = hasValidMonth
      ? getMonthRange(year, requestedMonth)
      : getYearRange(year);

    const events = await prisma.companyEvent.findMany({
      where: {
        organizationId: employee.organizationId,

        // Event overlap filter:
        // include events that start before range end and end after range start.
        startDate: {
          lt: range.end,
        },
        endDate: {
          gte: range.start,
        },
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        targetDepartment: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          startDate: "asc",
        },
        {
          title: "asc",
        },
      ],
    });

    const filteredEvents = events.filter((event) =>
      canViewEvent({
        event,
        employee,
      }),
    );

    return NextResponse.json({
      success: true,
      data: filteredEvents,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load events.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, employee } = await getCurrentEmployee();

    if (error || !employee) {
      return error;
    }

    const body = await request.json();

    if (body.seedNationalHolidays) {
      if (!MANAGE_ROLES.includes(employee.role as UserRole)) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 },
        );
      }

      const year = Number(body.year) || 2026;

      if (year !== 2026) {
        return NextResponse.json(
          { error: "Only 2026 national holiday import is supported." },
          { status: 400 },
        );
      }

      const yearStart = new Date(2026, 0, 1);
      const yearEnd = new Date(2027, 0, 1);

      // Make import idempotent: remove existing imported national holidays
      // for 2026, then insert the clean official list again.
      await prisma.companyEvent.deleteMany({
        where: {
          organizationId: employee.organizationId,
          isNational: true,
          type: "holiday",
          startDate: {
            gte: yearStart,
            lt: yearEnd,
          },
        },
      });

      const holidays = NATIONAL_HOLIDAYS_2026.map((holiday) => ({
        organizationId: employee.organizationId,
        createdBy: employee.id,
        title: holiday.title,
        description: "Imported Indonesian national holiday for 2026.",
        type: "holiday",
        color: "#EF4444",
        startDate: createDateOnly(holiday.date),
        endDate: createDateOnly(holiday.date),
        isAllDay: true,
        startTime: null,
        endTime: null,
        isNational: true,
        location: null,
        meetingUrl: null,
        targetRoles: "all",
        targetDepartmentId: null,
        isRecurring: false,
        recurringType: null,
      }));

      await prisma.companyEvent.createMany({
        data: holidays,
      });

      return NextResponse.json({
        success: true,
        message: `Imported ${holidays.length} Indonesian national holidays for 2026.`,
        data: {
          year: 2026,
          count: holidays.length,
        },
      });
    }

    if (!EVENT_CREATE_ROLES.includes(employee.role as UserRole)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 },
      );
    }

    const {
      title,
      description,
      type,
      color,
      startDate,
      endDate,
      isAllDay,
      startTime,
      endTime,
      location,
      meetingUrl,
      targetRoles,
      targetDepartmentId,
      isRecurring,
      recurringType,
    } = body;

    const cleanedTitle = typeof title === "string" ? title.trim() : "";

    if (!cleanedTitle || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Title, start date, and end date are required." },
        { status: 400 },
      );
    }

    const parsedStartDate = createDateOnly(String(startDate));
    const parsedEndDate = createDateOnly(String(endDate));

    if (Number.isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date." },
        { status: 400 },
      );
    }

    if (Number.isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid end date." },
        { status: 400 },
      );
    }

    if (parsedEndDate < parsedStartDate) {
      return NextResponse.json(
        { error: "End date cannot be earlier than start date." },
        { status: 400 },
      );
    }

    const allDay = isAllDay !== false;

    const event = await prisma.companyEvent.create({
      data: {
        organizationId: employee.organizationId,
        createdBy: employee.id,
        title: cleanedTitle,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        type: typeof type === "string" && type.trim() ? type.trim() : "event",
        color:
          typeof color === "string" && color.trim() ? color.trim() : "#0B5A43",
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isAllDay: allDay,
        startTime:
          !allDay && typeof startTime === "string" && startTime.trim()
            ? startTime.trim()
            : null,
        endTime:
          !allDay && typeof endTime === "string" && endTime.trim()
            ? endTime.trim()
            : null,
        isNational: false,
        location:
          typeof location === "string" && location.trim()
            ? location.trim()
            : null,
        meetingUrl:
          typeof meetingUrl === "string" && meetingUrl.trim()
            ? meetingUrl.trim()
            : null,
        targetRoles: normalizeTargetRoles(targetRoles),
        targetDepartmentId:
          typeof targetDepartmentId === "string" && targetDepartmentId.trim()
            ? targetDepartmentId.trim()
            : null,
        isRecurring: Boolean(isRecurring),
        recurringType:
          typeof recurringType === "string" && recurringType.trim()
            ? recurringType.trim()
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create event.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, employee } = await getCurrentEmployee();

    if (error || !employee) {
      return error;
    }

    if (!MANAGE_ROLES.includes(employee.role as UserRole)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required." },
        { status: 400 },
      );
    }

    const event = await prisma.companyEvent.findFirst({
      where: {
        id: eventId,
        organizationId: employee.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    await prisma.companyEvent.delete({
      where: {
        id: event.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete event.",
      },
      { status: 500 },
    );
  }
}