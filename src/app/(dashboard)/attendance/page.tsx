import { redirect } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { AttendanceTable } from "@/src/components/attendance/attendance-table";
import { CheckInButton } from "@/src/components/attendance/check-in-button";

export const dynamic = "force-dynamic";

interface AttendancePageProps {
  searchParams: {
    date?: string;
  };
}

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
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
      id: true,
      organizationId: true,
      firstName: true,
      role: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  const selectedDate = parseDateParam(searchParams.date);
  const selectedDateString = formatDateInputValue(selectedDate);

  const startOfSelectedDate = new Date(selectedDate);
  startOfSelectedDate.setHours(0, 0, 0, 0);

  const endOfSelectedDate = new Date(selectedDate);
  endOfSelectedDate.setHours(23, 59, 59, 999);

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const [attendanceRecords, totalEmployees, myAttendance] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        organizationId: currentEmployee.organizationId,
        date: {
          gte: startOfSelectedDate,
          lte: endOfSelectedDate,
        },
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            position: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ checkIn: "asc" }, { createdAt: "asc" }],
    }),

    prisma.employee.count({
      where: {
        organizationId: currentEmployee.organizationId,
        status: "active",
      },
    }),

    prisma.attendance.findFirst({
      where: {
        employeeId: currentEmployee.id,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
  ]);

  const presentCount = attendanceRecords.filter(
    (record) => record.status === "present",
  ).length;

  const lateCount = attendanceRecords.filter(
    (record) => record.status === "late",
  ).length;

  const recordedEmployeeIds = new Set(
    attendanceRecords.map((record) => record.employeeId),
  );

  const absentCount = Math.max(totalEmployees - recordedEmployeeIds.size, 0);

  const attendanceData = attendanceRecords.map((record) => ({
    id: record.id,
    employeeId: record.employee.employeeId,
    employeeName: `${record.employee.firstName ?? ""} ${
      record.employee.lastName ?? ""
    }`.trim(),
    position: record.employee.position,
    department: record.employee.department?.name ?? "—",
    checkIn: record.checkIn?.toISOString() ?? null,
    checkOut: record.checkOut?.toISOString() ?? null,
    status: record.status,
    notes: record.notes ?? "",
  }));

  const canEdit = ["owner", "admin", "hr"].includes(currentEmployee.role);

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Attendance
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track daily attendance, check-in, check-out, and work hours.
            </p>
          </div>

          <CheckInButton
            currentAttendance={
              myAttendance
                ? {
                    id: myAttendance.id,
                    checkIn: myAttendance.checkIn?.toISOString() ?? null,
                    checkOut: myAttendance.checkOut?.toISOString() ?? null,
                  }
                : null
            }
            employeeId={currentEmployee.id}
            employeeName={currentEmployee.firstName}
          />
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="Total employees"
          value={totalEmployees}
          description="Active employees"
          icon={<Users className="h-5 w-5" />}
        />

        <SummaryCard
          label="Present"
          value={presentCount}
          description="Checked in on time"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="green"
        />

        <SummaryCard
          label="Late"
          value={lateCount}
          description="Checked in late"
          icon={<Clock className="h-5 w-5" />}
          tone="orange"
        />

        <SummaryCard
          label="Absent"
          value={absentCount}
          description="No record yet"
          icon={<AlertCircle className="h-5 w-5" />}
          tone="red"
        />
      </section>

      <AttendanceTable
        data={attendanceData}
        selectedDate={selectedDateString}
        canEdit={canEdit}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "green" | "orange" | "red";
}) {
  const toneClass = {
    default: "border-gray-200 bg-gray-50 text-gray-600",
    green: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    orange: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${toneClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function parseDateParam(value?: string) {
  if (!value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  return date;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
