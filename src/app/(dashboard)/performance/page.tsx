'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Star, Plus, ChevronRight, Target, TrendingUp,
  ClipboardList, CheckCircle2, Clock, UserCircle,
  BarChart2, Award, AlertCircle
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

// ─── Types ────────────────────────────────────────────────
interface ReviewCycle {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
  description?: string
  _count: { reviews: number }
}

interface PerformanceReview {
  id: string
  status: string
  overallScore?: number
  selfScore?: number
  submittedAt?: string
  completedAt?: string
  employee: { id: string; firstName: string; lastName: string; position: string; department?: { name: string } }
  reviewer: { id: string; firstName: string; lastName: string }
  cycle: { id: string; name: string; type: string }
}

// ─── Helpers ──────────────────────────────────────────────
const cycleTypeLabel: Record<string, string> = {
  quarterly: 'Kuartalan',
  semi_annual: 'Semesteran',
  annual: 'Tahunan',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Selesai', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  self_submitted: { label: 'Self-Assessment', color: 'bg-purple-100 text-purple-700' },
  reviewed: { label: 'Direview', color: 'bg-blue-100 text-blue-700' },
}

function ScoreBadge({ score }: { score?: number | null }) {
  if (!score) return <span className="text-gray-400 text-sm">—</span>
  const color =
    score >= 4.5 ? 'text-green-600' :
    score >= 3.5 ? 'text-blue-600' :
    score >= 2.5 ? 'text-yellow-600' : 'text-red-600'
  return (
    <span className={`font-bold text-lg ${color}`}>
      {score.toFixed(1)}
      <span className="text-xs text-gray-400 font-normal">/5</span>
    </span>
  )
}

// ─── Create Cycle Modal ────────────────────────────────────
function CreateCycleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'annual', startDate: '', endDate: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/performance/cycles', {
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Buat Siklus Review Baru</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siklus *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="misal: Review Tahunan 2025"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="quarterly">Kuartalan (3 bulan)</option>
              <option value="semi_annual">Semesteran (6 bulan)</option>
              <option value="annual">Tahunan (12 bulan)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tujuan dan fokus review period ini..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Buat Siklus'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Self Assessment Modal ─────────────────────────────────
function SelfAssessmentModal({ review, onClose, onSaved }: { review: PerformanceReview; onClose: () => void; onSaved: () => void }) {
  const [selfAssessment, setSelfAssessment] = useState('')
  const [selfScore, setSelfScore] = useState(3)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/performance/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, type: 'self', selfAssessment, selfScore }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Self Assessment</h2>
          <p className="text-sm text-gray-500 mt-1">Penilaian diri — {review.cycle.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nilai Diri Sendiri (1–5) — Saat ini: {selfScore}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelfScore(n)}
                  className={`w-10 h-10 rounded-full font-semibold transition-all ${
                    selfScore >= n ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penilaian Diri *
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Ceritakan pencapaian, tantangan, dan kontribusi kamu selama periode ini..."
              value={selfAssessment}
              onChange={e => setSelfAssessment(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">{selfAssessment.length} karakter</p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Kirim Self Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Reviewer Score Modal ──────────────────────────────────
function ReviewScoreModal({ review, onClose, onSaved }: { review: PerformanceReview; onClose: () => void; onSaved: () => void }) {
  const [scores, setScores] = useState({
    attendanceScore: 3, workQualityScore: 3, teamworkScore: 3,
    initiativeScore: 3, communicationScore: 3,
  })
  const [texts, setTexts] = useState({ strengths: '', improvements: '', goals: '', reviewerNotes: '' })
  const [loading, setLoading] = useState(false)

  const scoreLabels = [
    { key: 'attendanceScore', label: 'Kehadiran & Kedisiplinan' },
    { key: 'workQualityScore', label: 'Kualitas Pekerjaan' },
    { key: 'teamworkScore', label: 'Kerjasama Tim' },
    { key: 'initiativeScore', label: 'Inisiatif & Kreativitas' },
    { key: 'communicationScore', label: 'Komunikasi' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/performance/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, type: 'review', ...scores, ...texts }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Review: {review.employee.firstName} {review.employee.lastName}</h2>
          <p className="text-sm text-gray-500">{review.employee.position} — {review.cycle.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Score inputs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Penilaian Kinerja</h3>
            <div className="space-y-3">
              {scoreLabels.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-56">{label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setScores(s => ({ ...s, [key]: n }))}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                          (scores as any)[key] >= n ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-blue-600 w-8">{(scores as any)[key]}/5</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Rata-rata Skor</span>
              <span className="text-2xl font-bold text-blue-700">{avgScore.toFixed(1)}/5</span>
            </div>
          </div>

          {/* Text fields */}
          {[
            { key: 'strengths', label: 'Kekuatan & Pencapaian', placeholder: 'Apa yang karyawan lakukan dengan sangat baik?' },
            { key: 'improvements', label: 'Area Perbaikan', placeholder: 'Apa yang perlu ditingkatkan?' },
            { key: 'goals', label: 'Target Periode Berikutnya', placeholder: 'Tujuan yang harus dicapai di periode selanjutnya...' },
            { key: 'reviewerNotes', label: 'Catatan Tambahan', placeholder: 'Catatan internal reviewer...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={placeholder}
                value={(texts as any)[key]}
                onChange={e => setTexts(t => ({ ...t, [key]: e.target.value }))}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Selesaikan Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function PerformancePage() {
  const [cycles, setCycles] = useState<ReviewCycle[]>([])
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'cycles' | 'my-reviews'>('my-reviews')
  const [showCreateCycle, setShowCreateCycle] = useState(false)
  const [selfAssessTarget, setSelfAssessTarget] = useState<PerformanceReview | null>(null)
  const [reviewTarget, setReviewTarget] = useState<PerformanceReview | null>(null)
  const [userRole, setUserRole] = useState('employee')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cyclesRes, reviewsRes] = await Promise.all([
        fetch('/api/performance/cycles'),
        fetch('/api/performance/review'),
      ])
      const cyclesData = await cyclesRes.json()
      const reviewsData = await reviewsRes.json()
      if (cyclesData.success) setCycles(cyclesData.data)
      if (reviewsData.success) setReviews(reviewsData.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const myReviews = reviews.filter(r => r.status !== 'completed' || r.overallScore !== undefined)
  const pendingSelf = reviews.filter(r => r.status === 'pending')
  const pendingReview = reviews.filter(r => r.status === 'self_submitted')
  const completed = reviews.filter(r => r.status === 'reviewed' || r.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Review</h1>
          <p className="text-sm text-gray-500 mt-1">Penilaian kinerja karyawan periodik</p>
        </div>
        <Button onClick={() => setShowCreateCycle(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Buat Siklus Review
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Siklus', value: cycles.length, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
          { label: 'Siklus Aktif', value: cycles.filter(c => c.status === 'active').length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Perlu Self-Assessment', value: pendingSelf.length, icon: UserCircle, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Perlu Direview', value: pendingReview.length, icon: Star, color: 'text-purple-600 bg-purple-50' },
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

      {/* Tabs */}
      <div className="border-b flex gap-6">
        {[
          { key: 'my-reviews', label: 'Review Saya' },
          { key: 'cycles', label: 'Siklus Review' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : tab === 'cycles' ? (
        /* Cycles Tab */
        <div className="space-y-3">
          {cycles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Belum ada siklus review</p>
              <p className="text-sm">Klik "Buat Siklus Review" untuk memulai</p>
            </div>
          ) : cycles.map(cycle => (
            <Card key={cycle.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{cycle.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[cycle.status]?.color}`}>
                        {statusConfig[cycle.status]?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {cycleTypeLabel[cycle.type]} · {new Date(cycle.startDate).toLocaleDateString('id-ID')} — {new Date(cycle.endDate).toLocaleDateString('id-ID')}
                    </p>
                    {cycle.description && <p className="text-xs text-gray-400 mt-1">{cycle.description}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{cycle._count.reviews}</div>
                    <div className="text-xs text-gray-400">review</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* My Reviews Tab */
        <div className="space-y-6">
          {/* Pending self-assessment */}
          {pendingSelf.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" /> Perlu Self-Assessment ({pendingSelf.length})
              </h3>
              <div className="space-y-2">
                {pendingSelf.map(r => (
                  <Card key={r.id} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.cycle.name}</p>
                        <p className="text-xs text-gray-500">Reviewer: {r.reviewer.firstName} {r.reviewer.lastName}</p>
                      </div>
                      <Button size="sm" onClick={() => setSelfAssessTarget(r)}>
                        Isi Self-Assessment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending review (as reviewer) */}
          {pendingReview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" /> Perlu Direview ({pendingReview.length})
              </h3>
              <div className="space-y-2">
                {pendingReview.map(r => (
                  <Card key={r.id} className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.employee.firstName} {r.employee.lastName}</p>
                        <p className="text-xs text-gray-500">{r.employee.position} · {r.cycle.name}</p>
                      </div>
                      <Button size="sm" onClick={() => setReviewTarget(r)}>
                        Review Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Selesai ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.cycle.name}</p>
                        <p className="text-xs text-gray-500">
                          {r.employee.firstName} {r.employee.lastName} · {r.employee.position}
                        </p>
                      </div>
                      <ScoreBadge score={r.overallScore} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pendingSelf.length === 0 && pendingReview.length === 0 && completed.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Belum ada review</p>
              <p className="text-sm">Review akan muncul saat HR membuat siklus review baru</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateCycle && (
        <CreateCycleModal onClose={() => setShowCreateCycle(false)} onCreated={fetchData} />
      )}
      {selfAssessTarget && (
        <SelfAssessmentModal review={selfAssessTarget} onClose={() => setSelfAssessTarget(null)} onSaved={fetchData} />
      )}
      {reviewTarget && (
        <ReviewScoreModal review={reviewTarget} onClose={() => setReviewTarget(null)} onSaved={fetchData} />
      )}
    </div>
  )
}