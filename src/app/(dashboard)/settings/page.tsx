import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { GeneralSettings } from '@/src/components/settings/general-settings'
import { LeaveSettings } from '@/src/components/settings/leave-settings'
import { WorkHoursSettings } from '@/src/components/settings/work-hours-settings'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
    },
  })

  if (!currentEmployee) {
    return null
  }

  // Only admin and owner can access settings
  if (!['owner', 'admin'].includes(currentEmployee.role)) {
    redirect('/dashboard')
  }

  // Get or create organization settings
  let settings = await prisma.organizationSettings.findUnique({
    where: { organizationId: currentEmployee.organizationId },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  })

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.organizationSettings.create({
      data: {
        organizationId: currentEmployee.organizationId,
        workStartTime: '09:00',
        workEndTime: '17:00',
        annualLeaveQuota: 12,
        sickLeaveQuota: 12,
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your organization configuration
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="work-hours">Work Hours</TabsTrigger>
          <TabsTrigger value="leave">Leave Policy</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneralSettings
                organizationId={currentEmployee.organizationId}
                organizationName={settings.organization.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Hours Settings */}
        <TabsContent value="work-hours">
          <Card>
            <CardHeader>
              <CardTitle>Work Hours Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkHoursSettings settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Settings */}
        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveSettings settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
