'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Briefcase,
  Users, Coffee, Clock, MapPin, Link2, Trash2,
  Star, Flag, AlertCircle, RefreshCw
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

// ─── Types ────────────────────────────────────────────────
interface CompanyEvent {
  id: string
  title: string
  description?: string
  type: string
  color: string
  startDate: string
  endDate: string
  isAllDay: boolean
  startTime?: string
  endTime?: string
  isNational: boolean
  location?: string
  meetingUrl?: string
  targetRoles: string
  creator: { firstName: string; lastName: string }
  targetDepartment?: { name: string }
}

// ─── Config ───────────────────────────────────────────────
const EVENT_TYPES = [
  { value: 'holiday',  label: 'Hari Libur',     icon: Star,       color: '#EF4444' },
  { value: 'event',    label: 'Event',           icon: Calendar,   color: '#3B82F6' },
  { value: 'meeting',  label: 'Rapat',           icon: Users,      color: '#8B5CF6' },
  { value: 'reminder', label: 'Pengingat',       icon: AlertCircle, color: '#F59E0B' },
  { value: 'birthday', label: 'Ulang Tahun',     icon: Coffee,     color: '#EC4899' },
  { value: 'training', label: 'Training',        icon: Briefcase,  color: '#10B981' },
]

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function getTypeConfig(type: string) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[1]
}

// ─── Create Event Modal ────────────────────────────────────
function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'event',
    color: '#3B82F6',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isAllDay: true,
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    meetingUrl: '',
    targetRoles: 'all',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTypeChange = (type: string) => {
    const cfg = getTypeConfig(type)
    setForm(f => ({ ...f, type, color: cfg.color }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.startDate || !form.endDate) {
      setError('Judul dan tanggal wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Tambah Event</h2>
            <p className="text-xs text-gray-500">Buat event di kalender perusahaan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Event *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="misal: Town Hall Q2 2025"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Event</label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.type === value
                      ? 'border-current bg-opacity-10'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  style={form.type === value ? { color, borderColor: color, backgroundColor: color + '15' } : {}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mulai *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selesai *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endDate}
                min={form.startDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={form.isAllDay}
              onChange={e => setForm(f => ({ ...f, isAllDay: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Seharian penuh</span>
          </label>

          {!form.isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="misal: Ruang Meeting A, Lt. 3"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Meeting (opsional)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://meet.google.com/..."
              value={form.meetingUrl}
              onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Peserta</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.targetRoles}
              onChange={e => setForm(f => ({ ...f, targetRoles: e.target.value }))}
            >
              <option value="all">Semua Karyawan</option>
              <option value="employee">Karyawan Saja</option>
              <option value="manager">Manager & Atas</option>
              <option value="hr">HR & Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Keterangan tambahan tentang event ini..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Tambah Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Calendar Grid ─────────────────────────────────────────
function CalendarGrid({
  year, month, events, onDayClick, selectedDay,
}: {
  year: number
  month: number  // 0-indexed
  events: CompanyEvent[]
  onDayClick: (day: number) => void
  selectedDay: number | null
}) {
  const today = new Date()

  // Build grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  // Map events to days
  const eventsByDay = useMemo(() => {
    const map: Record<number, CompanyEvent[]> = {}
    events.forEach(e => {
      const start = new Date(e.startDate)
      const end = new Date(e.endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate()
          map[day] = map[day] || []
          map[day].push(e)
        }
      }
    })
    return map
  }, [events, year, month])

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ID.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-2 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          const isSelected = selectedDay === day
          const dayEvents = eventsByDay[day] || []
          const isSunday = idx % 7 === 0
          const isSaturday = idx % 7 === 6
          const isWeekend = isSunday || isSaturday
          const hasHoliday = dayEvents.some(e => e.type === 'holiday' || e.isNational)

          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className={`
                relative min-h-[72px] p-1.5 rounded-xl text-left transition-all
                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                ${isToday ? 'bg-blue-600 hover:bg-blue-700' : ''}
                ${hasHoliday && !isToday ? 'bg-red-50' : ''}
              `}
            >
              <span
                className={`
                  text-xs font-semibold block mb-1
                  ${isToday ? 'text-white' : ''}
                  ${!isToday && (isSunday || hasHoliday) ? 'text-red-500' : ''}
                  ${!isToday && isSaturday && !hasHoliday ? 'text-blue-500' : ''}
                  ${!isToday && !isWeekend && !hasHoliday ? 'text-gray-700' : ''}
                `}
              >
                {day}
              </span>

              {/* Event dots */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <div
                    key={i}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium"
                    style={{
                      backgroundColor: ev.color + '25',
                      color: ev.color,
                      border: `1px solid ${ev.color}40`,
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 3} lagi</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())  // 0-indexed
  const [events, setEvents] = useState<CompanyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [isHRAdmin, setIsHRAdmin] = useState(false)
  const [seedingHolidays, setSeedingHolidays] = useState(false)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month + 1}`)
      const data = await res.json()
      if (data.success) setEvents(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [year, month])

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.success && d.data) setIsHRAdmin(['admin', 'hr', 'owner'].includes(d.data.role))
    }).catch(() => {})
  }, [])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus event ini?')) return
    await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  const seedHolidays = async () => {
    setSeedingHolidays(true)
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedNationalHolidays: true, year }),
      })
      fetchEvents()
    } finally {
      setSeedingHolidays(false)
    }
  }

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    return events.filter(e => {
      const start = new Date(e.startDate)
      const end = new Date(e.endDate)
      const target = new Date(year, month, selectedDay)
      return target >= start && target <= end
    })
  }, [events, selectedDay, year, month])

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return events
      .filter(e => new Date(e.startDate) >= now && new Date(e.startDate) <= oneWeek)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
  }, [events])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalender Perusahaan</h1>
          <p className="text-sm text-gray-500 mt-1">Jadwal, hari libur, dan event perusahaan</p>
        </div>
        <div className="flex gap-2">
          {isHRAdmin && (
            <Button
              variant="outline"
              onClick={seedHolidays}
              disabled={seedingHolidays}
              className="gap-2 text-sm"
            >
              <Flag className="h-4 w-4" />
              {seedingHolidays ? 'Loading...' : 'Import Hari Libur Nasional'}
            </Button>
          )}
          {isHRAdmin && (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Event
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">
                  {MONTHS_ID[month]} {year}
                </h2>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <CalendarGrid
                  year={year}
                  month={month}
                  events={events}
                  onDayClick={setSelectedDay}
                  selectedDay={selectedDay}
                />
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
                {EVENT_TYPES.map(({ label, color, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day events */}
          {selectedDay && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {selectedDay} {MONTHS_ID[month]} {year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Tidak ada event di hari ini</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map(ev => {
                      const cfg = getTypeConfig(ev.type)
                      const Icon = cfg.icon
                      return (
                        <div
                          key={ev.id}
                          className="p-3 rounded-lg border"
                          style={{ borderColor: ev.color + '40', backgroundColor: ev.color + '10' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="h-4 w-4 flex-shrink-0" style={{ color: ev.color }} />
                              <span className="font-medium text-sm text-gray-900 truncate">{ev.title}</span>
                            </div>
                            {isHRAdmin && !ev.isNational && (
                              <button
                                onClick={() => handleDelete(ev.id)}
                                className="text-gray-300 hover:text-red-500 flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {!ev.isAllDay && ev.startTime && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {ev.startTime} – {ev.endTime || '...'}
                            </div>
                          )}
                          {ev.location && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {ev.location}
                            </div>
                          )}
                          {ev.meetingUrl && (
                            <a
                              href={ev.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 mt-1 text-xs text-blue-500 hover:underline"
                            >
                              <Link2 className="h-3 w-3" />
                              Link Meeting
                            </a>
                          )}
                          {ev.description && (
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{ev.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">7 Hari ke Depan</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Tidak ada event dalam 7 hari ke depan</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map(ev => {
                    const cfg = getTypeConfig(ev.type)
                    const Icon = cfg.icon
                    const date = new Date(ev.startDate)
                    return (
                      <div key={ev.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="text-center flex-shrink-0 w-10">
                          <div className="text-lg font-bold text-gray-700">{date.getDate()}</div>
                          <div className="text-xs text-gray-400">{MONTHS_ID[date.getMonth()].slice(0, 3)}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: ev.color }} />
                            <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                          </div>
                          {!ev.isAllDay && ev.startTime && (
                            <p className="text-xs text-gray-400">{ev.startTime}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ringkasan Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {EVENT_TYPES.map(({ value, label, color }) => {
                  const count = events.filter(e => e.type === value).length
                  if (count === 0) return null
                  return (
                    <div key={value} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-gray-600">{label}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  )
                })}
                {events.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Belum ada event bulan ini</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreated={fetchEvents} />
      )}
    </div>
  )
}