import { NextRequest, NextResponse } from 'next/server'
import { generateEmployeeId } from '@/src/lib/utils'

import prisma from '@/src/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      email,
      firstName,
      lastName,
      organizationName,
      organizationSlug,
    } = body

    // Validate required fields
    if (!userId || !email || !firstName || !lastName || !organizationName || !organizationSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (email.length > 255) {
        return NextResponse.json(
            { error: 'Email exceeds maximum allowed length' },
            { status: 400 }
        );
    }

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization name already taken' },
        { status: 400 }
      )
    }

    // Create organization and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          maxEmployees: 10,
        },
      })

      // 2. Create Organization Settings (default)
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

      // 3. Create Employee (Owner/Admin)
      const employeeId = generateEmployeeId(organizationSlug, 0)
      
      const employee = await tx.employee.create({
        data: {
          organizationId: organization.id,
          authId: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          employeeId: employeeId,
          position: 'Owner',
          employmentType: 'full-time',
          baseSalary: 0, // Owner bisa set sendiri nanti
          currency: 'IDR',
          role: 'owner', // Highest privilege
          status: 'active',
        },
      })

      return { organization, employee }
    })

    return NextResponse.json({
      success: true,
      data: result,
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}