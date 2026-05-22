"use client";

// components/leave/leave-list.tsx
// Menampilkan daftar leave request milik user yang sedang login.
// Di-import oleh leave-page-client.tsx sebagai tab "My Requests".

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaveItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  isPaid: boolean;
  currentApprovalLevel: number;
  requiresApprovalLevels: number;
  rejectedReason?: string | null;
  createdAt: string;
  delegate?: { firstName: string; lastName: string } | null;
  delegateNotes?: string | null;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

// ─── Label helpers ────────────────────────────────────────────────────────────
const LEAVE_TYPE_LABEL: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick: "Cuti Sakit",
  maternity: "Cuti Melahirkan",
  marriage: "Cuti Menikah",
  child_marriage: "Cuti Menikahkan Anak",
  child_circumcision: "Cuti Khitanan Anak",
  child_baptism: "Cuti Baptis Anak",
  paternity: "Cuti Istri Melahirkan",
  family_death: "Cuti Keluarga Meninggal",
  extended_family_death: "Cuti Keluarga Meninggal (Lain)",
  hajj: "Cuti Haji",
  compensatory: "Cuti Pengganti Libur",
  business_trip_local: "Dinas Luar Kota",
  business_trip_province: "Dinas Luar Provinsi",
  out_of_office: "Out of Office",
  wfh: "Work From Home",
  wfa: "Work From Anywhere",
  unpaid: "Cuti Tanpa Upah",
};

function getLeaveTypeLabel(type: string) {
  return LEAVE_TYPE_LABEL[type] ?? type.replace(/_/g, " ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    className: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    label: "Disetujui",
    className: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Ditolak",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Approval level badge ─────────────────────────────────────────────────────
function ApprovalLevelBadge({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  if (max <= 1) return null;
  const isAwaitingHR = current === 2;
  return (
    <span
      className={`border px-2 py-0.5 text-[11px] font-semibold ${
        isAwaitingHR
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]"
      }`}
    >
      {isAwaitingHR ? "Menunggu HR" : "Menunggu Manager"}
    </span>
  );
}

// ─── FILTER TABS ──────────────────────────────────────────────────────────────
const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function LeaveList() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leave/list", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat data cuti");
      setLeaves(Array.isArray(data.leaves) ? data.leaves : []);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ── Client-side filter by status ──────────────────────────────────────────
  const filtered =
    statusFilter === "all"
      ? leaves
      : leaves.filter((l) => l.status === statusFilter);

  // ── Count per status untuk badge di filter button ─────────────────────────
  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  const handleFilterChange = (value: StatusFilter) => {
    startTransition(() => setStatusFilter(value));
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0B5A43]" />
        <span className="ml-3 text-sm text-gray-500">Memuat data cuti…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-gray-400" />
          {FILTER_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFilterChange(opt.value)}
                className={
                  isActive
                    ? "border border-[#0B5A43] bg-[#0B5A43] px-3 py-1.5 text-xs font-semibold text-white"
                    : "border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0B5A43]/40 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
                }
              >
                {opt.label}{" "}
                <span className={isActive ? "text-white/70" : "text-gray-400"}>
                  {counts[opt.value]}
                </span>
              </button>
            );
          })}

          {isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0B5A43]" />
          )}
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={fetchLeaves}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#0B5A43] disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!error && filtered.length === 0 && (
        <div className="border border-gray-200 bg-white px-4 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
            <Calendar className="h-6 w-6" />
          </div>
          <p className="mt-4 font-semibold text-gray-800">
            {statusFilter === "all"
              ? "Belum ada pengajuan cuti"
              : `Tidak ada cuti dengan status "${FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label}"`}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === "all"
              ? "Klik 'Request Leave' untuk mengajukan cuti baru."
              : "Coba pilih filter lain."}
          </p>
        </div>
      )}

      {/* ── Leave cards ──────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leave Card ───────────────────────────────────────────────────────────────
function LeaveCard({ leave }: { leave: LeaveItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 text-left"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-950">
                {getLeaveTypeLabel(leave.leaveType)}
              </p>
              {!leave.isPaid && (
                <span className="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                  Unpaid
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(leave.startDate)}
                {leave.startDate !== leave.endDate &&
                  ` – ${formatDate(leave.endDate)}`}
              </span>
              <span className="text-gray-400">·</span>
              <span>
                {leave.days} hari
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatusBadge status={leave.status} />
            {leave.status === "pending" && (
              <ApprovalLevelBadge
                current={leave.currentApprovalLevel}
                max={leave.requiresApprovalLevels}
              />
            )}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 text-sm">
          {/* Reason */}
          <div className="mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Alasan
            </p>
            <p className="mt-1 text-gray-700">{leave.reason}</p>
          </div>

          {/* Rejection reason */}
          {leave.status === "rejected" && leave.rejectedReason && (
            <div className="mb-3 border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                Alasan penolakan
              </p>
              <p className="mt-1 text-red-700">{leave.rejectedReason}</p>
            </div>
          )}

          {/* Delegation */}
          {leave.delegate && (
            <div className="mb-3 border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                Delegasi tugas
              </p>
              <p className="mt-1 font-medium text-amber-800">
                {leave.delegate.firstName} {leave.delegate.lastName}
              </p>
              {leave.delegateNotes && (
                <p className="mt-0.5 text-xs text-amber-700">
                  {leave.delegateNotes}
                </p>
              )}
            </div>
          )}

          {/* Submitted date */}
          <p className="text-xs text-gray-400">
            Diajukan {formatDate(leave.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}