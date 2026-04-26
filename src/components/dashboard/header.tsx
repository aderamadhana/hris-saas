'use client'

// src/components/dashboard/header.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import {
  Bell, LogOut, User, Settings, ChevronDown, Menu,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'

interface HeaderProps {
  userName?: string | null
  userEmail?: string | null
  userRole?: string | null
  onMenuToggle?: () => void
}

// ─── Safe initials helper ─────────────────────────────────────────────────────
function getInitials(name?: string | null, email?: string | null): string {
  // Try name first
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  // Fall back to email
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'U'
}

function getRoleBadge(role?: string | null) {
  const map: Record<string, { label: string; color: string }> = {
    owner:   { label: 'Owner',   color: 'bg-red-100 text-red-700' },
    admin:   { label: 'Admin',   color: 'bg-orange-100 text-orange-700' },
    hr:      { label: 'HR',      color: 'bg-purple-100 text-purple-700' },
    manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
    employee:{ label: 'Employee',color: 'bg-gray-100 text-gray-600' },
  }
  return map[role || ''] ?? { label: 'User', color: 'bg-gray-100 text-gray-600' }
}

export function Header({ userName, userEmail, userRole, onMenuToggle }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const [notifCount] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Safely derive display values — never call .split() on undefined
  const displayName = userName?.trim() || userEmail?.split('@')[0] || 'User'
  const displayEmail = userEmail?.trim() || ''
  const initials = getInitials(userName, userEmail)
  const roleBadge = getRoleBadge(userRole)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white px-4 sm:px-6">
      {/* Mobile menu toggle */}
      {onMenuToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Page title area — flexible spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5 text-gray-500" />
            {notifCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-lg hover:bg-gray-100"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shrink-0">
                {initials}
              </div>

              {/* Name + role — hidden on small screens */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight max-w-[140px] truncate">
                  {displayName}
                </p>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', roleBadge.color)}>
                  {roleBadge.label}
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                {displayEmail && (
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                )}
                <span className={cn('mt-0.5 self-start text-[10px] font-medium px-1.5 py-0.5 rounded-full', roleBadge.color)}>
                  {roleBadge.label}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </Link>
            </DropdownMenuItem>

            {['owner', 'admin'].includes(userRole || '') && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Keluar...' : 'Keluar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}