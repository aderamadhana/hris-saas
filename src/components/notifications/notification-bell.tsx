'use client'

// src/components/notifications/notification-bell.tsx
// Bell icon di header dengan dropdown list notifikasi

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, X, Calendar, DollarSign, Clock, Users, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  resourceType?: string
  resourceId?: string
  sender?: {
    firstName: string
    lastName: string
  }
}

const notificationIcon = (type: string) => {
  switch (type) {
    case 'leave_submitted':
    case 'leave_approved':
    case 'leave_rejected':
      return <Calendar className="h-4 w-4" />
    case 'payroll_generated':
    case 'payroll_approved':
    case 'payroll_paid':
      return <DollarSign className="h-4 w-4" />
    case 'attendance_reminder':
      return <Clock className="h-4 w-4" />
    case 'welcome':
      return <Users className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

const notificationColor = (type: string) => {
  switch (type) {
    case 'leave_approved':
    case 'payroll_paid':
      return 'bg-green-100 text-green-600'
    case 'leave_rejected':
      return 'bg-red-100 text-red-600'
    case 'leave_submitted':
      return 'bg-yellow-100 text-yellow-600'
    case 'payroll_generated':
    case 'payroll_approved':
      return 'bg-blue-100 text-blue-600'
    case 'welcome':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const resourceLink = (resourceType?: string, resourceId?: string) => {
  if (!resourceType || !resourceId) return null
  switch (resourceType) {
    case 'leave':
      return `/leave`
    case 'payroll':
      return `/payslip`
    default:
      return null
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=15')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch saat mount dan setiap 30 detik
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const markOneAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markOneAsRead(notif.id)
    }
    const link = resourceLink(notif.resourceType, notif.resourceId)
    if (link) {
      setIsOpen(false)
      router.push(link)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} belum dibaca</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Tandai semua dibaca"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Baca semua
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !notif.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notificationColor(notif.type)}`}>
                      {notificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/notifications')
                }}
                className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat semua notifikasi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}