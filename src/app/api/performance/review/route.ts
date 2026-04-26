// src/app/api/performance/review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: list reviews (my reviews or all)
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

    let where: any = { organizationId: employee.organizationId }
    if (cycleId) where.cycleId = cycleId

    // Non-admin/hr can only see own reviews
    if (!['admin', 'hr', 'owner'].includes(employee.role)) {
      where.OR = [
        { employeeId: employee.id },
        { reviewerId: employee.id },
      ]
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true, department: { select: { name: true } } } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        cycle: { select: { id: true, name: true, type: true } },
        goals_list: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: reviews })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: create review (HR/Admin start a cycle for employee)
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
    const { cycleId, employeeId, reviewerId } = body

    if (!cycleId || !employeeId || !reviewerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const review = await prisma.performanceReview.create({
      data: {
        organizationId: employee.organizationId,
        cycleId,
        employeeId,
        reviewerId,
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, data: review })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Review already exists for this employee in this cycle' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: submit self-assessment or reviewer scores
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const body = await request.json()
    const { reviewId, type, ...data } = body

    const review = await prisma.performanceReview.findUnique({
      where: { id: reviewId },
    })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    let updateData: any = {}

    if (type === 'self') {
      // Employee submitting self-assessment
      if (review.employeeId !== employee.id) {
        return NextResponse.json({ error: 'Cannot submit self-assessment for others' }, { status: 403 })
      }
      updateData = {
        selfAssessment: data.selfAssessment,
        selfScore: data.selfScore,
        status: 'self_submitted',
        submittedAt: new Date(),
      }
    } else if (type === 'review') {
      // Reviewer submitting scores
      if (review.reviewerId !== employee.id) {
        return NextResponse.json({ error: 'Not authorized to review' }, { status: 403 })
      }
      const scores = [
        data.attendanceScore, data.workQualityScore, data.teamworkScore,
        data.initiativeScore, data.communicationScore,
      ].filter(Boolean)
      const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

      updateData = {
        attendanceScore: data.attendanceScore,
        workQualityScore: data.workQualityScore,
        teamworkScore: data.teamworkScore,
        initiativeScore: data.initiativeScore,
        communicationScore: data.communicationScore,
        overallScore,
        strengths: data.strengths,
        improvements: data.improvements,
        goals: data.goals,
        reviewerNotes: data.reviewerNotes,
        status: 'reviewed',
        completedAt: new Date(),
      }
    }

    const updated = await prisma.performanceReview.update({
      where: { id: reviewId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}