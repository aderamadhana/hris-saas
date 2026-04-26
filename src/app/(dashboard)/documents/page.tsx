'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FileText, Upload, Download, Trash2, Eye, Plus,
  File, Image, FileSpreadsheet, Shield, Clock,
  Search, Filter, CheckCircle, AlertTriangle, FolderOpen
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'

// ─── Types ────────────────────────────────────────────────
interface EmployeeDocument {
  id: string
  employeeId: string
  category: string
  name: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize: number
  isPrivate: boolean
  isVerified: boolean
  expiresAt?: string
  createdAt: string
  employee: { firstName: string; lastName: string; employeeId: string }
  uploader: { firstName: string; lastName: string }
}

// ─── Config ───────────────────────────────────────────────
const CATEGORIES = [
  { value: 'contract', label: 'Kontrak Kerja', color: 'bg-blue-100 text-blue-700' },
  { value: 'id_card', label: 'KTP / Identitas', color: 'bg-purple-100 text-purple-700' },
  { value: 'certificate', label: 'Sertifikat', color: 'bg-green-100 text-green-700' },
  { value: 'diploma', label: 'Ijazah', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'photo', label: 'Foto', color: 'bg-pink-100 text-pink-700' },
  { value: 'bpjs', label: 'BPJS', color: 'bg-teal-100 text-teal-700' },
  { value: 'tax', label: 'NPWP / Pajak', color: 'bg-orange-100 text-orange-700' },
  { value: 'medical', label: 'Surat Kesehatan', color: 'bg-red-100 text-red-700' },
  { value: 'other', label: 'Lainnya', color: 'bg-gray-100 text-gray-700' },
]

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  jpg: Image, jpeg: Image, png: Image, webp: Image,
  xlsx: FileSpreadsheet, xls: FileSpreadsheet,
  doc: File, docx: File,
}

function getCategoryConfig(value: string) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function isExpiringSoon(expiresAt?: string) {
  if (!expiresAt) return false
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// ─── Upload Modal ──────────────────────────────────────────
function UploadModal({
  employees,
  currentEmployeeId,
  isHRAdmin,
  onClose,
  onUploaded,
}: {
  employees: { id: string; firstName: string; lastName: string; employeeId: string }[]
  currentEmployeeId: string
  isHRAdmin: boolean
  onClose: () => void
  onUploaded: () => void
}) {
  const [form, setForm] = useState({
    employeeId: currentEmployeeId,
    category: 'other',
    name: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf',
    fileSize: '0',
    isPrivate: false,
    expiresAt: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Simulate upload — in real app integrate Supabase Storage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fileUrl || !form.name) {
      setError('Nama dan URL file wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileSize: parseInt(form.fileSize) || 0 }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onUploaded()
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
            <Upload className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Upload Dokumen</h2>
            <p className="text-xs text-gray-500">Tambahkan dokumen karyawan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          {isHRAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan *</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                required
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dokumen *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="misal: KTP Ahmad Fauzi"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL File *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://... (dari Supabase Storage)"
              value={form.fileUrl}
              onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Upload file ke Supabase Storage dulu, lalu paste URL-nya di sini</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe File</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.fileType}
                onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
              >
                {['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'].map(t => (
                  <option key={t} value={t}>.{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran (bytes)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={form.fileSize}
                onChange={e => setForm(f => ({ ...f, fileSize: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kadaluarsa</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">Opsional, untuk dokumen yang memiliki masa berlaku (KTP, SIM, dll)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Keterangan tambahan..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {isHRAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={form.isPrivate}
                onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Dokumen rahasia (hanya HR & Admin yang bisa lihat)</span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Dokumen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Document Card ─────────────────────────────────────────
function DocumentCard({ doc, onDelete }: { doc: EmployeeDocument; onDelete: (id: string) => void }) {
  const cat = getCategoryConfig(doc.category)
  const FileIcon = FILE_ICONS[doc.fileType] || File
  const expired = isExpired(doc.expiresAt)
  const expiringSoon = isExpiringSoon(doc.expiresAt)

  return (
    <Card className={`transition-all hover:shadow-md ${expired ? 'border-red-200' : expiringSoon ? 'border-yellow-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            expired ? 'bg-red-50' : expiringSoon ? 'bg-yellow-50' : 'bg-blue-50'
          }`}>
            <FileIcon className={`h-5 w-5 ${expired ? 'text-red-500' : expiringSoon ? 'text-yellow-500' : 'text-blue-500'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {doc.employee.firstName} {doc.employee.lastName} · {doc.employee.employeeId}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.isPrivate && (
                  <span title="Rahasia"><Shield className="h-3.5 w-3.5 text-gray-400" /></span>
                )}
                {doc.isVerified && (
                  <span title="Terverifikasi"><CheckCircle className="h-3.5 w-3.5 text-green-500" /></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
              <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
              <span className="text-xs text-gray-400 uppercase">.{doc.fileType}</span>
            </div>

            {doc.expiresAt && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-400'}`}>
                {(expired || expiringSoon) && <AlertTriangle className="h-3 w-3" />}
                <Clock className="h-3 w-3" />
                {expired ? 'Kadaluarsa: ' : 'Berlaku sampai: '}
                {new Date(doc.expiresAt).toLocaleDateString('id-ID')}
              </div>
            )}

            {doc.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{doc.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-gray-400 flex-1">
            Diupload oleh {doc.uploader.firstName} · {new Date(doc.createdAt).toLocaleDateString('id-ID')}
          </span>
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <Eye className="h-3 w-3" /> Lihat
            </Button>
          </a>
          <a href={doc.fileUrl} download>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <Download className="h-3 w-3" /> Unduh
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              if (confirm('Hapus dokumen ini?')) onDelete(doc.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs, setDocs] = useState<EmployeeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [employees, setEmployees] = useState<any[]>([])
  const [currentEmployeeId, setCurrentEmployeeId] = useState('')
  const [isHRAdmin, setIsHRAdmin] = useState(false)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      if (data.success) setDocs(data.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (data.success || Array.isArray(data)) {
        setEmployees(Array.isArray(data) ? data : data.data || [])
      }
    } catch {}
  }

  useEffect(() => {
    fetchDocs()
    fetchEmployees()
    // Get current user info from profile
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.success && d.data) {
        setCurrentEmployeeId(d.data.id)
        setIsHRAdmin(['admin', 'hr', 'owner'].includes(d.data.role))
      }
    }).catch(() => {})
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) fetchDocs()
    } catch {}
  }

  const filtered = docs.filter(d => {
    const matchSearch = !search || [d.name, d.employee.firstName, d.employee.lastName, d.description].some(
      s => s?.toLowerCase().includes(search.toLowerCase())
    )
    const matchCat = filterCategory === 'all' || d.category === filterCategory
    return matchSearch && matchCat
  })

  const expiredCount = docs.filter(d => isExpired(d.expiresAt)).length
  const expiringSoonCount = docs.filter(d => isExpiringSoon(d.expiresAt)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumen Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dokumen & berkas karyawan</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Upload Dokumen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Dokumen', value: docs.length, icon: FolderOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Terverifikasi', value: docs.filter(d => d.isVerified).length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Segera Kadaluarsa', value: expiringSoonCount, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Sudah Kadaluarsa', value: expiredCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
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
            placeholder="Cari dokumen atau karyawan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">Semua Kategori</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{docs.length === 0 ? 'Belum ada dokumen' : 'Tidak ada hasil'}</p>
          <p className="text-sm">
            {docs.length === 0 ? 'Klik "Upload Dokumen" untuk menambahkan' : 'Coba ubah filter pencarian'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          employees={employees}
          currentEmployeeId={currentEmployeeId}
          isHRAdmin={isHRAdmin}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchDocs}
        />
      )}
    </div>
  )
}