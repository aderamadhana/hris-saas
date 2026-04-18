// src/app/api/register/route.ts
// User Registration API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      firstName, 
      lastName,
      organizationName 
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      
      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create or get organization
    let organization
    
    if (organizationName) {
      // Create new organization
      organization = await prisma.organization.create({
         data: {
                name: 'Default Organization',
                slug: 'default-organization', // wajib
                settings: {
                create: {
                    annualLeaveQuota: 12,
                },
                },
            },
        })
    } else {
      // Get first organization (for demo/testing)
      organization = await prisma.organization.findFirst()
      
      if (!organization) {
        // Create default organization if none exists
        organization = await prisma.organization.create({
         data: {
                name: 'Default Organization',
                slug: 'default-organization', // wajib
                settings: {
                create: {
                    annualLeaveQuota: 12,
                },
                },
            },
        })
      }
    }

    // Create employee record in database
    const employee = await prisma.employee.create({
        data: {
            authId: authData.user.id,
            organizationId: organization.id,
            email,
            firstName,
            lastName,

            employeeId: `EMP-${Date.now()}`, // bebas, tapi harus unique
            position: 'Staff',               // default dulu
            baseSalary: new Prisma.Decimal(0), // wajib Decimal

            role: 'employee',
            status: 'active',
        },
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists in database' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}