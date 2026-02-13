// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma' // ← Changed
import { Sidebar } from '@/src/components/dashboard/sidebar'
import { Header } from '@/src/components/dashboard/header'
import { MobileSidebar } from '@/src/components/dashboard/mobile-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('arema');
    redirect('/login')
  }

  // Get employee data from database
  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    include: {
      organization: true,
    },
  })

  if (!employee) {
    // If employee not found, logout and redirect
    await supabase.auth.signOut()
    redirect('/login')
  }

  const userData = {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    role: employee.role,
  }

  const organizationData = {
    name: employee.organization.name,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <Sidebar 
          userName={`${userData.firstName} ${userData.lastName}`}
          userEmail={userData.email}
          userRole={userData.role}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 md:px-0">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <MobileSidebar />
          </div>
          
          {/* Header Component */}
          <div className="flex-1">
            <Header user={userData} organization={organizationData} />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}