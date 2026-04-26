import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'
 
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
 
    const { announcementId } = await request.json()
    if (!announcementId) return NextResponse.json({ error: 'announcementId required' }, { status: 400 })
 
    await prisma.announcementRead.upsert({
      where: { announcementId_employeeId: { announcementId, employeeId: employee.id } },
      create: { announcementId, employeeId: employee.id },
      update: { readAt: new Date() },
    })
 
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}