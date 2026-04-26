'use client'

// src/app/(dashboard)/notifications/page.tsx
// Halaman full notifikasi dengan filter

import { useState, useEffect } from 'react'
import { Bell, Calendar, DollarSign, Clock, Users, Info, CheckCheck, Trash2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
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
}

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    leave_submitted: 'Pengajuan Cuti',
    leave_approved: 'Cuti Disetujui',
    leave_rejected: 'Cuti Ditolak',
    payroll_generated: 'Payslip',
    payroll_approved: 'Payroll Disetujui',
    payroll_paid: 'Gaji Dibayar',
    attendance_reminder: 'Pengingat Absen',
    welcome: 'Selamat Datang',
    system: 'Sistem',
  }
  return map[type] || type
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'leave_submitted':
    case 'leave_approved':
    case 'leave_rejected':
      return <Calendar className="h-5 w-5" />
    case 'payroll_generated':
    case 'payroll_approved':
    case 'payroll_paid':
      return <DollarSign className="h-5 w-5" />
    case 'attendance_reminder':
      return <Clock className="h-5 w-5" />
    case 'welcome':
      return <Users className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}

const typeColor = (type: string) => {
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = async () => {
    try {
      const url = filter === 'unread'
        ? '/api/notifications?limit=50&unread=true'
        : '/api/notifications?limit=50'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

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

  // Grup per hari
  const grouped = notifications.reduce((acc, notif) => {
    const day = format(new Date(notif.createdAt), 'dd MMMM yyyy', { locale: id })
    if (!acc[day]) acc[day] = []
    acc[day].push(notif)
    return acc
  }, {} as Record<string, Notification[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'Semua' : `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Bell className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{day}</p>
              <div className="space-y-2">
                {items.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && markOneAsRead(notif.id)}
                    className={`flex gap-4 rounded-xl border p-4 transition-colors cursor-pointer ${
                      !notif.isRead
                        ? 'border-blue-100 bg-blue-50/50 hover:bg-blue-50'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColor(notif.type)}`}>
                      {typeIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {typeLabel(notif.type)}
                          </span>
                          {!notif.isRead && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                              Baru
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}