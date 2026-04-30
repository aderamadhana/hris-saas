// src/app/api/settings/payroll/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  )
}

function errorResponse(message: string, status = 500, code = 'SERVER_ERROR') {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  )
}

function isAllowedRole(role: string) {
  return ['admin', 'owner'].includes(role)
}

function cleanPayrollPayload(body: Record<string, unknown>) {
  const protectedFields = ['id', 'organizationId', 'createdAt', 'updatedAt']

  return Object.fromEntries(
    Object.entries(body).filter(([key, value]) => {
      return !protectedFields.includes(key) && value !== undefined
    })
  )
}

// GET — ambil konfigurasi payroll organisasi
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(
        'Sesi kamu sudah berakhir. Silakan login kembali.',
        401,
        'UNAUTHORIZED'
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        organizationId: true,
        role: true,
      },
    })

    if (!employee) {
      return errorResponse(
        'Akun kamu belum terhubung dengan data karyawan.',
        404,
        'EMPLOYEE_NOT_FOUND'
      )
    }

    if (!isAllowedRole(employee.role)) {
      return errorResponse(
        'Kamu tidak memiliki akses untuk melihat pengaturan payroll.',
        403,
        'FORBIDDEN'
      )
    }

    const config = await prisma.payrollConfig.findUnique({
      where: {
        organizationId: employee.organizationId,
      },
    })

    return successResponse({
      message: config
        ? 'Konfigurasi payroll berhasil dimuat.'
        : 'Konfigurasi payroll belum dibuat.',
      config: config ?? null,
    })
  } catch (error) {
    console.error('GET /api/settings/payroll:', error)

    return errorResponse(
      'Terjadi kesalahan saat memuat konfigurasi payroll. Silakan coba lagi.',
      500,
      'GET_PAYROLL_CONFIG_FAILED'
    )
  }
}

// PUT — simpan / update konfigurasi payroll
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(
        'Sesi kamu sudah berakhir. Silakan login kembali.',
        401,
        'UNAUTHORIZED'
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        organizationId: true,
        role: true,
      },
    })

    if (!employee) {
      return errorResponse(
        'Akun kamu belum terhubung dengan data karyawan.',
        404,
        'EMPLOYEE_NOT_FOUND'
      )
    }

    if (!isAllowedRole(employee.role)) {
      return errorResponse(
        'Kamu tidak memiliki akses untuk mengubah pengaturan payroll.',
        403,
        'FORBIDDEN'
      )
    }

    let body: Record<string, unknown>

    try {
      body = await request.json()
    } catch {
      return errorResponse(
        'Format data tidak valid. Pastikan data yang dikirim berupa JSON.',
        400,
        'INVALID_JSON'
      )
    }

    const data = cleanPayrollPayload(body)

    const config = await prisma.payrollConfig.upsert({
      where: {
        organizationId: employee.organizationId,
      },
      create: {
        organizationId: employee.organizationId,
        ...data,
      },
      update: data,
    })

    return successResponse({
      message: 'Konfigurasi payroll berhasil disimpan.',
      config,
    })
  } catch (error) {
    console.error('PUT /api/settings/payroll:', error)

    return errorResponse(
      'Terjadi kesalahan saat menyimpan konfigurasi payroll. Silakan coba lagi.',
      500,
      'SAVE_PAYROLL_CONFIG_FAILED'
    )
  }
}