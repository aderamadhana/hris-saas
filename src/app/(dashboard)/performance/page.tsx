// app/(dashboard)/performance/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { PerformanceClient } from "@/components/performance/performance-client";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      id: true,
      role: true,
      organizationId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!employee) redirect("/dashboard");

  const isHRAdmin = ["hr", "admin", "owner"].includes(employee.role);

  // Fetch review cycles
  const cycles = await prisma.reviewCycle.findMany({
    where: { organizationId: employee.organizationId },
    include: { _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Fetch own reviews (for employee view)
  const myReviews = await prisma.performanceReview.findMany({
    where: {
      organizationId: employee.organizationId,
      revieweeId: employee.id,
    },
    include: {
      cycle: { select: { id: true, name: true, type: true, status: true } },
      reviewer: { select: { firstName: true, lastName: true } },
      goals: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // HR/Admin: fetch all reviews in org
  const allReviews = isHRAdmin
    ? await prisma.performanceReview.findMany({
        where: { organizationId: employee.organizationId },
        include: {
          cycle: { select: { id: true, name: true, type: true, status: true } },
          reviewee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              position: true,
            },
          },
          reviewer: { select: { firstName: true, lastName: true } },
          goals: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Serialize Decimal/Date
  const serializeCycles = cycles.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    description: c.description,
    reviewCount: c._count.reviews,
  }));

  const serializeReview = (r: any) => ({
    id: r.id,
    status: r.status,
    selfRating: r.selfRating,
    managerRating: r.managerRating,
    overallRating: r.overallRating,
    selfComments: r.selfComments,
    managerComments: r.managerComments,
    strengths: r.strengths,
    improvements: r.improvements,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    cycle: r.cycle,
    reviewer: r.reviewer
      ? { name: `${r.reviewer.firstName} ${r.reviewer.lastName}` }
      : null,
    reviewee: r.reviewee
      ? {
          name: `${r.reviewee.firstName} ${r.reviewee.lastName}`,
          employeeId: r.reviewee.employeeId,
          position: r.reviewee.position,
        }
      : null,
    goals: (r.goals ?? []).map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      targetDate: g.targetDate?.toISOString() ?? null,
      status: g.status,
      progress: g.progress,
    })),
  });

  return (
    <PerformanceClient
      currentEmployeeId={employee.id}
      currentEmployeeName={`${employee.firstName} ${employee.lastName}`}
      userRole={employee.role}
      isHRAdmin={isHRAdmin}
      cycles={serializeCycles}
      myReviews={myReviews.map(serializeReview)}
      allReviews={allReviews.map(serializeReview)}
    />
  );
}
