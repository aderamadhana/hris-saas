// src/app/(dashboard)/profile/edit/page.tsx
// Edit profile page

import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { ProfileForm } from '@/src/components/profile/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
  })

  if (!employee) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your personal information
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm employee={employee} />
        </CardContent>
      </Card>
    </div>
  )
}