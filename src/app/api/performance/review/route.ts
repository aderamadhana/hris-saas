// src/app/api/performance/review/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ─── GET: list reviews ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const isAdminHR = ['admin', 'hr', 'owner'].includes(employee.role)

    const where: any = { organizationId: employee.organizationId }
    if (cycleId) where.cycleId = cycleId
    if (!isAdminHR) {
      where.OR = [
        { revieweeId: employee.id },
        { reviewerId: employee.id },
      ]
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        reviewee: {
          select: {
            id: true, firstName: true, lastName: true,
            position: true, employeeId: true,
            department: { select: { name: true } },
          },
        },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        cycle: { select: { id: true, name: true, type: true, status: true } },
        goals: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const serialized = reviews.map((r) => ({
      id:              r.id,
      status:          r.status,
      selfRating:      r.selfRating,
      managerRating:   r.managerRating,
      overallRating:   r.overallRating,
      selfComments:    r.selfComments,
      managerComments: r.managerComments,
      strengths:       r.strengths,
      improvements:    r.improvements,
      submittedAt:     r.submittedAt?.toISOString() ?? null,
      createdAt:       r.createdAt.toISOString(),
      cycle:           r.cycle,
      reviewer:        r.reviewer
        ? { id: r.reviewer.id, name: `${r.reviewer.firstName} ${r.reviewer.lastName}` }
        : null,
      reviewee: r.reviewee
        ? {
            id:         r.reviewee.id,
            name:       `${r.reviewee.firstName} ${r.reviewee.lastName}`,
            employeeId: r.reviewee.employeeId,
            position:   r.reviewee.position,
            department: r.reviewee.department?.name ?? null,
          }
        : null,
      goals: (r.goals ?? []).map((g) => ({
        id:          g.id,
        title:       g.title,
        description: g.description,
        targetDate:  g.targetDate?.toISOString() ?? null,
        status:      g.status,
        progress:    g.progress,
      })),
    }))

    return NextResponse.json({ success: true, reviews: serialized })
  } catch (error: any) {
    console.error('GET /api/performance/review error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── POST: buat review baru (HR/Admin) ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    if (!['admin', 'hr', 'owner'].includes(employee.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { cycleId, revieweeId, reviewerId } = body

    if (!cycleId || !revieweeId || !reviewerId) {
      return NextResponse.json(
        { error: 'cycleId, revieweeId, dan reviewerId wajib diisi' },
        { status: 400 }
      )
    }

    const cycle = await prisma.reviewCycle.findFirst({
      where: { id: cycleId, organizationId: employee.organizationId },
    })
    if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })

    const review = await prisma.performanceReview.create({
      data: {
        organizationId: employee.organizationId,
        cycleId,
        revieweeId,
        reviewerId,
        status: 'pending_employee',
      },
    })

    return NextResponse.json({ success: true, data: review })
  } catch (error: any) {
    console.error('POST /api/performance/review error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Review already exists for this employee in this cycle' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── PUT: submit self-assessment ATAU manager review ─────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const body = await request.json()
    const { reviewId, type } = body

    if (!reviewId || !type) {
      return NextResponse.json({ error: 'reviewId dan type wajib diisi' }, { status: 400 })
    }

    const review = await prisma.performanceReview.findUnique({ where: { id: reviewId } })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    if (review.organizationId !== employee.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let updateData: any = {}

    // ── Self-assessment ───────────────────────────────────────────────────────
    if (type === 'self') {
      if (review.revieweeId !== employee.id) {
        return NextResponse.json(
          { error: 'Cannot submit self-assessment for other employees' },
          { status: 403 }
        )
      }
      const selfRating = body.selfRating ?? null
      if (selfRating !== null && (selfRating < 1 || selfRating > 5)) {
        return NextResponse.json({ error: 'Self rating must be between 1 and 5' }, { status: 400 })
      }
      updateData = {
        selfRating,
        selfComments: body.selfComments ?? null,
        strengths:    body.strengths    ?? null,
        improvements: body.improvements ?? null,
        status:       'pending_manager',
        submittedAt:  new Date(),
      }

    // ── Manager review ────────────────────────────────────────────────────────
    } else if (type === 'manager') {
      const isReviewer = review.reviewerId === employee.id
      const isAdminHR  = ['admin', 'hr', 'owner'].includes(employee.role)
      if (!isReviewer && !isAdminHR) {
        return NextResponse.json({ error: 'Not authorized to submit this review' }, { status: 403 })
      }

      const managerRating = body.managerRating ?? null
      if (managerRating !== null && (managerRating < 1 || managerRating > 5)) {
        return NextResponse.json({ error: 'Manager rating must be between 1 and 5' }, { status: 400 })
      }

      // Overall = average of self + manager
      const overallRating = (() => {
        const self    = review.selfRating ?? null
        const manager = managerRating
        if (self !== null && manager !== null) {
          return Math.round(((Number(self) + Number(manager)) / 2) * 10) / 10
        }
        return manager ?? self ?? null
      })()

      updateData = {
        managerRating,
        managerComments: body.managerComments ?? null,
        strengths:       body.strengths       ?? review.strengths,
        improvements:    body.improvements    ?? review.improvements,
        overallRating,
        status: 'completed',
      }
    } else {
      return NextResponse.json({ error: 'type harus "self" atau "manager"' }, { status: 400 })
    }

    const updated = await prisma.performanceReview.update({
      where: { id: reviewId },
      data:  updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('PUT /api/performance/review error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}