'use client'

import { useState, useEffect } from 'react'
import {
  Megaphone, Plus, Pin, Bell, Info, AlertTriangle,
  CheckCircle, Calendar, Eye, Trash2, Edit, Search,
  ChevronDown, ChevronRight, BookOpen, Users, Globe
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'

// ─── Types ────────────────────────────────────────────────
interface Announcement {
  id: string
  title: string
  content: string
  type: string
  isPinned: boolean
  isPublished: boolean
  publishedAt?: string
  expiresAt?: string
  targetRoles: string
  attachmentUrl?: string
  attachmentName?: string
  isRead: boolean
  readAt?: string
  _count: { reads: number }
  author: { firstName: string; lastName: string; position: string }
  targetDepartment?: { name: string }
  createdAt: string
}

// ─── Config ───────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  info:    { label: 'Informasi', icon: Info,          color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100' },
  warning: { label: 'Perhatian', icon: AlertTriangle,  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
  urgent:  { label: 'Penting',   icon: Bell,           color: 'text-red-600',   bg: 'bg-red-50 border-red-100' },
  event:   { label: 'Event',     icon: Calendar,       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Create Announcement Modal ─────────────────────────────
function CreateAnnouncementModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'info',
    isPinned: false,
    isPublished: true,
    targetRoles: 'all',
    expiresAt: '',
    attachmentUrl: '',
    attachmentName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      setError('Judul dan isi pengumuman wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/announcements', {
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Buat Pengumuman</h2>
            <p className="text-xs text-gray-500">Kirim pengumuman ke karyawan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Judul pengumuman..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman *</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Tulis isi pengumuman di sini..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {Object.entries(TYPE_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Penerima</label>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Hingga (opsional)</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={form.isPinned}
                onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Sematkan (Pin) di atas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={form.isPublished}
                onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Publikasikan sekarang</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : form.isPublished ? 'Publikasikan' : 'Simpan Draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Announcement Card ─────────────────────────────────────
function AnnouncementCard({
  announcement,
  onRead,
  isHRAdmin,
  onDelete,
}: {
  announcement: Announcement
  onRead: (id: string) => void
  isHRAdmin: boolean
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info
  const Icon = cfg.icon

  const handleExpand = () => {
    setExpanded(v => !v)
    if (!announcement.isRead) onRead(announcement.id)
  }

  return (
    <Card className={`transition-all border ${cfg.bg} ${!announcement.isRead ? 'shadow-md' : ''}`}>
      <CardContent className="p-0">
        {/* Header */}
        <button
          className="w-full text-left p-4 flex items-start gap-3"
          onClick={handleExpand}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/80 ${cfg.color}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {announcement.isPinned && (
                  <Pin className="h-3.5 w-3.5 text-gray-400" />
                )}
                <span className={`font-semibold text-sm ${!announcement.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                  {announcement.title}
                </span>
                {!announcement.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                )}
              </div>
              <ChevronRight className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full font-medium bg-white/70 ${cfg.color}`}>{cfg.label}</span>
              <span>{announcement.author.firstName} {announcement.author.lastName}</span>
              <span>{timeAgo(announcement.publishedAt || announcement.createdAt)}</span>
              {announcement.targetRoles !== 'all' && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {announcement.targetRoles}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {announcement._count.reads} dibaca
              </span>
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
            </div>

            {announcement.attachmentUrl && (
              <a
                href={announcement.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                {announcement.attachmentName || 'Lihat Lampiran'}
              </a>
            )}

            {announcement.expiresAt && (
              <p className="text-xs text-gray-400">
                Berlaku hingga: {new Date(announcement.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {isHRAdmin && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs gap-1"
                  onClick={() => { if (confirm('Hapus pengumuman ini?')) onDelete(announcement.id) }}
                >
                  <Trash2 className="h-3 w-3" /> Hapus
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isHRAdmin, setIsHRAdmin] = useState(false)

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      if (data.success) setAnnouncements(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.success && d.data) {
        setIsHRAdmin(['admin', 'hr', 'owner', 'manager'].includes(d.data.role))
      }
    }).catch(() => {})
  }, [])

  const handleRead = async (announcementId: string) => {
    try {
      await fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      })
      setAnnouncements(prev =>
        prev.map(a => a.id === announcementId ? { ...a, isRead: true } : a)
      )
    } catch {}
  }

  const handleDelete = async (id: string) => {
    // Call DELETE API (implement in announcements/[id]/route.ts)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const unreadCount = announcements.filter(a => !a.isRead).length
  const pinnedCount = announcements.filter(a => a.isPinned).length

  const filtered = announcements.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || a.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Pengumuman
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Informasi dan pengumuman perusahaan</p>
        </div>
        {isHRAdmin && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Buat Pengumuman
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: announcements.length, icon: Megaphone, color: 'text-blue-600 bg-blue-50' },
          { label: 'Belum Dibaca', value: unreadCount, icon: Bell, color: 'text-red-600 bg-red-50' },
          { label: 'Disematkan', value: pinnedCount, icon: Pin, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Sudah Dibaca', value: announcements.filter(a => a.isRead).length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cari pengumuman..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {[{ val: 'all', label: 'Semua' }, ...Object.entries(TYPE_CONFIG).map(([val, { label }]) => ({ val, label }))].map(
            ({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilterType(val)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{announcements.length === 0 ? 'Belum ada pengumuman' : 'Tidak ada hasil'}</p>
          <p className="text-sm">{announcements.length === 0 ? 'Pengumuman baru akan muncul di sini' : 'Coba ubah filter'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onRead={handleRead}
              isHRAdmin={isHRAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAnnouncementModal onClose={() => setShowCreate(false)} onCreated={fetchAnnouncements} />
      )}
    </div>
  )
}