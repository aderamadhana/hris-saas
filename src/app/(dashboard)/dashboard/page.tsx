// src/app/(dashboard)/dashboard/page.tsx
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { EmployeeDashboard } from "@/src/components/dashboard/employee-dashboard";
import { AdminDashboard } from "@/src/components/dashboard/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    include: {
      organization: { select: { id: true, name: true } },
      department: { select: { name: true } },
    },
  });

  if (!employee) redirect("/login");

  const orgId = employee.organizationId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const isAdminRole = ["owner", "admin", "hr", "manager"].includes(
    employee.role,
  );

  // Serialize employee — strip Decimal and Date to plain values
  const employeePlain = {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    role: employee.role,
    position: employee.position,
    employeeId: employee.employeeId,
    departmentId: employee.departmentId,
    organizationId: employee.organizationId,
    organization: {
      id: employee.organization.id,
      name: employee.organization.name,
    },
    department: employee.department ? { name: employee.department.name } : null,
  };

  // ── EMPLOYEE dashboard ──────────────────────────────────────────────────
  if (!isAdminRole) {
    const workingDays = countWorkingDays(startOfMonth, now);

    const [
      attendanceThisMonth,
      pendingLeave,
      approvedLeave,
      todayAttendance,
      leaveBalance,
    ] = await Promise.all([
      prisma.attendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: startOfMonth, lte: now },
          status: { in: ["present", "late"] },
        },
      }),
      prisma.leave.count({
        where: { employeeId: employee.id, status: "pending" },
      }),
      prisma.leave.count({
        where: {
          employeeId: employee.id,
          status: "approved",
          startDate: { gte: startOfYear },
        },
      }),
      prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: todayStart, lt: todayEnd },
        },
        select: { checkIn: true, status: true },
      }),
      prisma.leave.aggregate({
        where: {
          employeeId: employee.id,
          leaveType: "annual",
          status: { in: ["approved", "pending"] },
          startDate: { gte: startOfYear },
        },
        _sum: { days: true },
      }),
    ]);

    const usedAnnual = leaveBalance._sum.days ?? 0;

    const employeeStats = {
      attendanceThisMonth,
      workingDaysThisMonth: workingDays,
      pendingLeave,
      approvedLeave,
      annualLeaveBalance: Math.max(0, 12 - usedAnnual),
      todayCheckedIn: !!todayAttendance?.checkIn,
      todayCheckInTime: todayAttendance?.checkIn
        ? todayAttendance.checkIn.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    };

    return <EmployeeDashboard employee={employeePlain} stats={employeeStats} />;
  }

  // ── ADMIN / HR / MANAGER dashboard ──────────────────────────────────────
  const [
    totalEmployees,
    activeEmployees,
    newEmployeesThisMonth,
    todayAttendances,
    pendingLeave,
    approvedLeaveThisMonth,
    recentLeavesRaw,
  ] = await Promise.all([
    prisma.employee.count({ where: { organizationId: orgId } }),
    prisma.employee.count({
      where: { organizationId: orgId, status: "active" },
    }),
    prisma.employee.count({
      where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
    }),
    prisma.attendance.findMany({
      where: {
        organizationId: orgId,
        date: { gte: todayStart, lt: todayEnd },
      },
      select: { status: true },
    }),
    prisma.leave.count({
      where: { organizationId: orgId, status: "pending" },
    }),
    prisma.leave.count({
      where: {
        organizationId: orgId,
        status: "approved",
        startDate: { gte: startOfMonth },
      },
    }),
    prisma.leave.findMany({
      where: { organizationId: orgId },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const presentToday = todayAttendances.filter((a) =>
    ["present", "late"].includes(a.status),
  ).length;
  const absentToday = Math.max(0, activeEmployees - todayAttendances.length);
  const attendanceRate =
    activeEmployees > 0
      ? Math.round((presentToday / activeEmployees) * 100)
      : 0;

  const adminStats = {
    totalEmployees,
    activeEmployees,
    presentToday,
    absentToday,
    pendingLeave,
    approvedLeaveThisMonth,
    newEmployeesThisMonth,
    attendanceRate,
  };

  // Serialize dates in recent leaves
  const recentLeaves = recentLeavesRaw.map((l) => ({
    id: l.id,
    employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
    leaveType: l.leaveType,
    startDate: l.startDate.toISOString().split("T")[0],
    days: l.days,
    status: l.status,
  }));

  return (
    <AdminDashboard
      employee={employeePlain}
      role={employee.role}
      stats={adminStats}
      recentLeaves={recentLeaves}
    />
  );
}

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
