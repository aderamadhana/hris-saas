'use client'

// src/components/sidebar.tsx
// UPDATE: Tambahkan menu Notifikasi dan Laporan

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Building2,
  Wallet,
  Settings,
  UserCircle,
  FileText,
  Bell,
  BarChart3,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  userRole: string
  userName: string
  userEmail: string
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  badge?: string
}

const navigationItems: NavigationItem[] = [
  // Common — semua role
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['employee', 'manager', 'hr', 'admin', 'owner'],
  },
  {
    name: 'Profil Saya',
    href: '/profile',
    icon: UserCircle,
    roles: ['employee', 'manager', 'hr', 'admin', 'owner'],
  },

  // Time & Leave — semua role
  {
    name: 'Absensi',
    href: '/attendance',
    icon: Clock,
    roles: ['employee', 'manager', 'hr', 'admin', 'owner'],
  },
  {
    name: 'Cuti',
    href: '/leave',
    icon: CalendarDays,
    roles: ['employee', 'manager', 'hr', 'admin', 'owner'],
  },

  // Finance — semua role (masing-masing lihat datanya sendiri / semua)
  {
    name: 'Slip Gaji',
    href: '/payslip',
    icon: FileText,
    roles: ['employee', 'manager', 'hr', 'admin', 'owner'],
  },

  // Management — Manager ke atas
  {
    name: 'Karyawan',
    href: '/employees',
    icon: Users,
    roles: ['manager', 'hr', 'admin', 'owner'],
  },
  {
    name: 'Departemen',
    href: '/departments',
    icon: Building2,
    roles: ['hr', 'admin', 'owner'],
  },

  // HR Tools — HR ke atas
  {
    name: 'Payroll',
    href: '/payroll',
    icon: Wallet,
    roles: ['hr', 'admin', 'owner'],
  },
  {
    name: 'Laporan',
    href: '/reports',
    icon: BarChart3,
    roles: ['hr', 'admin', 'owner'],
  },

  // Admin only
  {
    name: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'owner'],
  },

  // Owner only
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    roles: ['owner'],
  },

  // Common — semua role (di bawah)
  {
    name: 'Notifikasi',
    href: '/notifications',
    icon: Bell,
    roles: ['employee', 'manager', 'hr', 'admin', 'owner'],
  },
]

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  hr: 'HR',
  manager: 'Manager',
  employee: 'Karyawan',
}

const roleColor: Record<string, string> = {
  owner: 'bg-red-100 text-red-700',
  admin: 'bg-orange-100 text-orange-700',
  hr: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-600',
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-xs font-bold text-white">HR</span>
        </div>
        <span className="text-sm font-bold text-gray-900">HRIS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-gray-900">{userName}</p>
            <span className={cn('mt-0.5 inline-flex rounded-full px-1.5 py-px text-[10px] font-medium', roleColor[userRole] || 'bg-gray-100 text-gray-600')}>
              {roleLabel[userRole] || userRole}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </div>
    </aside>
  )
}