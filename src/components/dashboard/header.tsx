'use client'

// src/components/dashboard/header.tsx
// Header dengan NotificationBell terintegrasi
// REPLACE file header yang sudah ada dengan ini

import { useState } from 'react'
import { Menu, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { NotificationBell } from '@/src/components/notifications/notification-bell'

interface HeaderProps {
  userName: string
  userEmail: string
  userRole: string
  onMenuClick?: () => void
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    hr: 'HR',
    manager: 'Manager',
    employee: 'Karyawan',
  }
  return map[role] || role
}

const roleColor = (role: string) => {
  const map: Record<string, string> = {
    owner: 'bg-red-100 text-red-700',
    admin: 'bg-orange-100 text-orange-700',
    hr: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    employee: 'bg-gray-100 text-gray-600',
  }
  return map[role] || 'bg-gray-100 text-gray-600'
}

export function Header({ userName, userEmail, userRole, onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
      {/* Mobile menu button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
        />
      </div>

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell — komponen baru */}
        <NotificationBell />

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{userName.split(' ')[0]}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleColor(userRole)}`}>
                {roleLabel(userRole)}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white shadow-lg">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  <span className={`mt-1 inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${roleColor(userRole)}`}>
                    {roleLabel(userRole)}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/dashboard/profile')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profil Saya
                  </button>

                  {['admin', 'owner'].includes(userRole) && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        router.push('/dashboard/settings')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      Pengaturan
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}