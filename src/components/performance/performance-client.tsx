"use client";

// src/components/performance/performance-client.tsx

import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Plus,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: string;
  progress: number;
}

interface Review {
  id: string;
  status: string;
  selfRating?: number | null;
  managerRating?: number | null;
  overallRating?: number | null;
  selfComments?: string | null;
  managerComments?: string | null;
  strengths?: string | null;
  improvements?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  cycle: { id: string; name: string; type: string; status: string };
  reviewer?: { name: string } | null;
  reviewee?: { name: string; employeeId: string; position: string } | null;
  goals: Goal[];
}

interface Cycle {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  reviewCount: number;
}

interface PerformanceClientProps {
  currentEmployeeId: string;
  currentEmployeeName: string;
  userRole: string;
  isHRAdmin: boolean;
  cycles: Cycle[];
  myReviews: Review[];
  allReviews: Review[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function ratingColor(rating?: number | null) {
  if (!rating) return "text-gray-400";
  if (rating >= 4.5) return "text-[#0B5A43]";
  if (rating >= 3.5) return "text-[#7A5A00]";
  return "text-red-600";
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active:           "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    completed:        "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    pending:          "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
    pending_manager:  "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
    pending_employee: "border-blue-200 bg-blue-50 text-blue-700",
    in_progress:      "border-blue-200 bg-blue-50 text-blue-700",
    draft:            "border-gray-200 bg-gray-50 text-gray-600",
    closed:           "border-gray-200 bg-gray-50 text-gray-600",
    cancelled:        "border-red-200 bg-red-50 text-red-600",
  };
  return map[status] ?? "border-gray-200 bg-gray-50 text-gray-600";
}

function StarRating({ value }: { value?: number | null }) {
  if (!value) return <span className="text-sm text-gray-400">Not rated</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= Math.round(value) ? "fill-[#F7A81B] text-[#F7A81B]" : "text-gray-200"}`}
        />
      ))}
      <span className={`ml-1 text-sm font-semibold ${ratingColor(value)}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Create Cycle Modal ────────────────────────────────────────────────────────

function CreateCycleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", type: "annual", startDate: "", endDate: "", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      setError("Name, start date, and end date are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/performance/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create cycle");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
      <div className="w-full max-w-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-950">New Review Cycle</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cycle Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Q1 2025 Performance Review"
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            >
              <option value="annual">Annual</option>
              <option value="quarterly">Quarterly</option>
              <option value="mid_year">Mid-Year</option>
              <option value="probation">Probation</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#0B5A43] text-white hover:bg-[#084735]">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Cycle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, isHRAdmin }: { review: Review; isHRAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-start justify-between gap-4 p-4 hover:bg-gray-50"
      >
        <div className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-950">{review.cycle.name}</p>
            <span className={`border px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadge(review.status)}`}>
              {review.status.replace(/_/g, " ")}
            </span>
            <span className="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500 capitalize">
              {review.cycle.type.replace(/_/g, " ")}
            </span>
          </div>
          {isHRAdmin && review.reviewee && (
            <p className="mt-1 text-sm text-gray-500">
              {review.reviewee.name} · {review.reviewee.position}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {review.reviewer ? `Reviewer: ${review.reviewer.name}` : "No reviewer assigned"} ·{" "}
            {formatDate(review.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {review.overallRating && <StarRating value={review.overallRating} />}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Ratings */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Self Rating</p>
              <div className="mt-2"><StarRating value={review.selfRating} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Manager Rating</p>
              <div className="mt-2"><StarRating value={review.managerRating} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Overall</p>
              <div className="mt-2"><StarRating value={review.overallRating} /></div>
            </div>
          </div>

          {/* Comments */}
          {review.selfComments && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Self Assessment</p>
              <p className="mt-1 text-sm text-gray-700">{review.selfComments}</p>
            </div>
          )}
          {review.managerComments && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Manager Feedback</p>
              <p className="mt-1 text-sm text-gray-700">{review.managerComments}</p>
            </div>
          )}
          {review.strengths && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Strengths</p>
              <p className="mt-1 text-sm text-gray-700">{review.strengths}</p>
            </div>
          )}
          {review.improvements && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Areas to Improve</p>
              <p className="mt-1 text-sm text-gray-700">{review.improvements}</p>
            </div>
          )}

          {/* Goals */}
          {review.goals.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Goals</p>
              <div className="space-y-2">
                {review.goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-950">{goal.title}</p>
                      <span className={`shrink-0 border px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadge(goal.status)}`}>
                        {goal.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="mt-1 text-xs text-gray-500">{goal.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-[#0B5A43]"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#0B5A43]">{goal.progress}%</span>
                    </div>
                    {goal.targetDate && (
                      <p className="mt-1 text-xs text-gray-400">Due: {formatDate(goal.targetDate)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "my_reviews" | "cycles" | "all_reviews";

export function PerformanceClient({
  currentEmployeeId,
  isHRAdmin,
  cycles,
  myReviews,
  allReviews,
}: PerformanceClientProps) {
  const [tab, setTab] = useState<Tab>("my_reviews");
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [localCycles, setLocalCycles] = useState(cycles);
  const [reloading, setReloading] = useState(false);

  const tabs: Array<{ value: Tab; label: string; count: number; show: boolean }> = [
    { value: "my_reviews",  label: "My Reviews",   count: myReviews.length,  show: true },
    { value: "cycles",      label: "Review Cycles", count: localCycles.length, show: true },
    { value: "all_reviews", label: "All Reviews",   count: allReviews.length, show: isHRAdmin },
  ];

  const reloadCycles = async () => {
    setReloading(true);
    try {
      const res = await fetch("/api/performance/cycles", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.cycles)) {
        setLocalCycles(
          data.cycles.map((c: any) => ({
            id: c.id, name: c.name, type: c.type, status: c.status,
            startDate: c.startDate, endDate: c.endDate,
            description: c.description, reviewCount: c._count?.reviews ?? 0,
          }))
        );
      }
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      {/* Header */}
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Performance</h1>
            <p className="mt-1 text-sm text-gray-500">Track performance reviews, goals, and ratings.</p>
          </div>
          {isHRAdmin && (
            <Button onClick={() => setShowCreateCycle(true)} className="bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />New Review Cycle
            </Button>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="My Reviews"    value={myReviews.length}                                               icon={<Star className="h-5 w-5" />} />
        <StatCard label="Active Cycles" value={localCycles.filter((c) => c.status === "active").length}       icon={<Calendar className="h-5 w-5" />} tone="green" />
        <StatCard label="Completed"     value={myReviews.filter((r) => r.status === "completed").length}      icon={<CheckCircle className="h-5 w-5" />} tone="green" />
        <StatCard label="Pending"       value={myReviews.filter((r) => r.status.startsWith("pending")).length} icon={<Clock className="h-5 w-5" />} tone="orange" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-white px-4">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={[
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === t.value
                ? "border-[#0B5A43] text-[#0B5A43]"
                : "border-transparent text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${tab === t.value ? "bg-[#EAF5F0] text-[#0B5A43]" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "my_reviews" && (
        <div className="space-y-3">
          {myReviews.length === 0 ? (
            <EmptyState icon={<Star className="h-6 w-6" />} title="No reviews yet" description="Your performance reviews will appear here once HR creates one for you." />
          ) : (
            myReviews.map((r) => <ReviewCard key={r.id} review={r} isHRAdmin={false} />)
          )}
        </div>
      )}

      {tab === "cycles" && (
        <div className="space-y-3">
          {localCycles.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No review cycles"
              description="Create a review cycle to start performance evaluations."
              action={
                isHRAdmin ? (
                  <Button onClick={() => setShowCreateCycle(true)} className="bg-[#0B5A43] text-white hover:bg-[#084735]">
                    <Plus className="mr-2 h-4 w-4" />Create Cycle
                  </Button>
                ) : undefined
              }
            />
          ) : (
            localCycles.map((cycle) => (
              <div key={cycle.id} className="border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-950">{cycle.name}</p>
                      <span className={`border px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadge(cycle.status)}`}>
                        {cycle.status}
                      </span>
                      <span className="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500 capitalize">
                        {cycle.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {cycle.description && (
                      <p className="mt-1 text-sm text-gray-500">{cycle.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                      <Users className="h-3.5 w-3.5" />
                      {cycle.reviewCount} reviews
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "all_reviews" && isHRAdmin && (
        <div className="space-y-3">
          {allReviews.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No reviews" description="No performance reviews have been created yet." />
          ) : (
            allReviews.map((r) => <ReviewCard key={r.id} review={r} isHRAdmin={true} />)
          )}
        </div>
      )}

      {/* Create cycle modal */}
      {showCreateCycle && (
        <CreateCycleModal
          onClose={() => setShowCreateCycle(false)}
          onCreated={() => {
            setShowCreateCycle(false);
            reloadCycles();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label, value, icon,
  tone = "default",
}: {
  label: string; value: number; icon: React.ReactNode; tone?: "default" | "green" | "orange";
}) {
  const cls = {
    default: { icon: "border-gray-200 bg-gray-50 text-gray-600",          value: "text-gray-950" },
    green:   { icon: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",   value: "text-[#0B5A43]" },
    orange:  { icon: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",   value: "text-[#7A5A00]" },
  }[tone];

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`mt-2 text-3xl font-semibold ${cls.value}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cls.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

function EmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">{icon}</div>
      <p className="mt-4 font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}