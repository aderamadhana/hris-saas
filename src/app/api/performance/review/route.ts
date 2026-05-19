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

    // Non-admin hanya lihat review miliknya sendiri (sebagai employee atau reviewer)
    if (!isAdminHR) {
      where.OR = [
        { employeeId: employee.id },
        { reviewerId: employee.id },
      ]
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          select: {
            id:         true,
            firstName:  true,
            lastName:   true,
            position:   true,
            department: { select: { name: true } },
          },
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        cycle: {
          select: { id: true, name: true, type: true },
        },
        // goals_list dihapus — cek dulu apakah GoalTracking ada di schema kamu
        // Kalau ada, uncomment baris berikut:
        // goals_list: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, reviews })
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
    const { cycleId, employeeId, reviewerId } = body

    if (!cycleId || !employeeId || !reviewerId) {
      return NextResponse.json({ error: 'cycleId, employeeId, dan reviewerId wajib diisi' }, { status: 400 })
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

// ─── PUT: submit self-assessment atau reviewer scores ────────────────────────
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

    if (!reviewId || !type) {
      return NextResponse.json({ error: 'reviewId dan type wajib diisi' }, { status: 400 })
    }

    const review = await prisma.performanceReview.findUnique({
      where: { id: reviewId },
    })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    let updateData: any = {}

    if (type === 'self') {
      // Employee submit self-assessment
      if (review.employeeId !== employee.id) {
        return NextResponse.json(
          { error: 'Cannot submit self-assessment for other employees' },
          { status: 403 }
        )
      }
      updateData = {
        selfAssessment: data.selfAssessment ?? null,
        selfScore:      data.selfScore      ?? null,
        status:         'self_submitted',
        submittedAt:    new Date(),
      }
    } else if (type === 'reviewer') {
      // Reviewer submit scores
      if (review.reviewerId !== employee.id) {
        return NextResponse.json(
          { error: 'Not authorized to submit this review' },
          { status: 403 }
        )
      }

      const scoreFields = [
        data.attendanceScore,
        data.workQualityScore,
        data.teamworkScore,
        data.initiativeScore,
        data.communicationScore,
      ].filter((s) => s !== null && s !== undefined)

      const overallScore =
        scoreFields.length > 0
          ? scoreFields.reduce((a: number, b: number) => a + b, 0) / scoreFields.length
          : null

      updateData = {
        attendanceScore:    data.attendanceScore    ?? null,
        workQualityScore:   data.workQualityScore   ?? null,
        teamworkScore:      data.teamworkScore      ?? null,
        initiativeScore:    data.initiativeScore    ?? null,
        communicationScore: data.communicationScore ?? null,
        overallScore,
        strengths:          data.strengths     ?? null,
        improvements:       data.improvements  ?? null,
        goals:              data.goals         ?? null,
        reviewerNotes:      data.reviewerNotes ?? null,
        status:             'reviewed',
        completedAt:        new Date(),
      }
    } else {
      return NextResponse.json({ error: 'type harus "self" atau "reviewer"' }, { status: 400 })
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