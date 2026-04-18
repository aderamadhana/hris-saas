import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { generateEmployeeId } from '@/src/lib/utils'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()

  // Tukarkan code dengan session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const user = data.user
  const metadata = user.user_metadata

  try {
    // Cek apakah employee sudah ada (misal sudah pernah callback)
    const existingEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
    })

    if (existingEmployee) {
      // Sudah ada, langsung ke dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Ambil data dari metadata yang disimpan saat register
    const firstName = metadata?.first_name || 'User'
    const lastName = metadata?.last_name || ''
    const organizationName = metadata?.organization_name || 'My Organization'
    const organizationSlug = metadata?.organization_slug || `org-${Date.now()}`

    // Cek apakah slug sudah ada, kalau ada tambahkan suffix
    let finalSlug = organizationSlug
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    })
    if (existingOrg) {
      finalSlug = `${organizationSlug}-${Date.now()}`
    }

    // Buat organization + employee dalam transaction
    await prisma.$transaction(async (tx) => {
      // 1. Buat Organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: finalSlug,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          maxEmployees: 10,
        },
      })

      // 2. Buat Organization Settings
      await tx.organizationSettings.create({
        data: {
          organizationId: organization.id,
          workingDaysPerWeek: 5,
          workStartTime: '09:00',
          workEndTime: '17:00',
          timezone: 'Asia/Jakarta',
          annualLeaveQuota: 12,
          sickLeaveQuota: 12,
        },
      })

      // 3. Buat Employee sebagai Owner
      const employeeId = generateEmployeeId(finalSlug, 0)

      await tx.employee.create({
        data: {
          organizationId: organization.id,
          authId: user.id,
          email: user.email!,
          firstName,
          lastName,
          employeeId,
          position: 'Owner',
          employmentType: 'full-time',
          baseSalary: 0,
          currency: 'IDR',
          role: 'owner',
          status: 'active',
        },
      })
    })

    // Redirect ke dashboard setelah setup selesai
    return NextResponse.redirect(`${origin}/dashboard`)

  } catch (err: any) {
    console.error('Callback setup error:', err)
    // Tetap redirect ke dashboard, biar user bisa masuk
    // Error bisa di-handle di dashboard (jika employee tidak ditemukan)
    return NextResponse.redirect(`${origin}/dashboard?setup_error=true`)
  }
}