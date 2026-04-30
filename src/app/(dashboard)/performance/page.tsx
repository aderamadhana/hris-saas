"use client";

// src/app/(dashboard)/dashboard/performance/page.tsx

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Star,
  Target,
  Trophy,
  UserCircle,
  X,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface ReviewCycle {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string | null;
  _count?: {
    reviews?: number;
  };
}

interface PerformanceReview {
  id: string;
  status: string;
  overallScore?: number | null;
  selfScore?: number | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string | null;
    department?: {
      name: string;
    } | null;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  cycle: {
    id: string;
    name: string;
    type: string;
  };
}

type ApiListResponse<T> =
  | T[]
  | {
      success?: boolean;
      data?: T[];
      cycles?: T[];
      reviews?: T[];
      error?: string;
    };

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700",
  },
  active: {
    label: "Active",
    className: "bg-[#EAF5F0] text-[#0B5A43]",
  },
  self_submitted: {
    label: "Self Submitted",
    className: "bg-blue-50 text-blue-700",
  },
  reviewed: {
    label: "Reviewed",
    className: "bg-[#EAF5F0] text-[#0B5A43]",
  },
  completed: {
    label: "Completed",
    className: "bg-[#EAF5F0] text-[#0B5A43]",
  },
};

const CYCLE_TYPE_LABEL: Record<string, string> = {
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
};

function getStatus(status: string) {
  return (
    STATUS_STYLE[status] ?? {
      label: status.replaceAll("_", " "),
      className: "bg-gray-100 text-gray-700",
    }
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getFullName(person?: {
  firstName?: string | null;
  lastName?: string | null;
}) {
  return `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim() || "-";
}

function getApiError(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractList<T>(
  payload: ApiListResponse<T> | null,
  key: "cycles" | "reviews",
): T[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;

  if (key === "cycles" && Array.isArray(payload.cycles)) {
    return payload.cycles;
  }

  if (key === "reviews" && Array.isArray(payload.reviews)) {
    return payload.reviews;
  }

  return [];
}

async function fetchReviewsWithFallback() {
  const primaryResponse = await fetch("/api/performance/review", {
    cache: "no-store",
  });

  const primaryPayload =
    await readJson<ApiListResponse<PerformanceReview>>(primaryResponse);

  if (primaryResponse.ok) {
    return {
      response: primaryResponse,
      payload: primaryPayload,
    };
  }

  const fallbackResponse = await fetch("/api/performance/reviews", {
    cache: "no-store",
  });

  const fallbackPayload =
    await readJson<ApiListResponse<PerformanceReview>>(fallbackResponse);

  if (fallbackResponse.ok) {
    return {
      response: fallbackResponse,
      payload: fallbackPayload,
    };
  }

  return {
    response: primaryResponse,
    payload: primaryPayload,
  };
}

function StatusBadge({ status }: { status: string }) {
  const config = getStatus(status);

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold capitalize ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ScoreValue({ score }: { score?: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  const colorClass =
    score >= 4
      ? "text-[#0B5A43]"
      : score >= 3
        ? "text-[#7A5A00]"
        : "text-red-600";

  return (
    <span className={`text-sm font-semibold ${colorClass}`}>
      {score.toFixed(1)}
    </span>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Unable to load performance data</p>
        <p>{message}</p>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  tone?: "default" | "green" | "orange";
}) {
  const iconClass = {
    default: "border-gray-200 bg-gray-50 text-gray-600",
    green: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    orange: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
  }[tone];

  const valueClass = {
    default: "text-gray-950",
    green: "text-[#0B5A43]",
    orange: "text-[#7A5A00]",
  }[tone];

  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight ${valueClass}`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white px-4 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        {icon}
      </div>

      <p className="mt-4 font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

function ModalShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex min-h-[100dvh] w-screen items-start justify-center overflow-y-auto bg-black/45 px-4 py-10">
      {children}
    </div>,
    document.body,
  );
}

function CreateCycleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "annual",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/performance/cycles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(getApiError(payload, "Failed to create review cycle."));
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create review cycle.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell>
      <div className="w-full max-w-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              New Review Cycle
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a review period for employee performance assessment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cycle Name
            </label>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Annual Review 2026"
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            >
              <option value="quarterly">Quarterly</option>
              <option value="semi_annual">Semi-Annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                required
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional notes for this review cycle."
              className="min-h-24 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0B5A43] text-white hover:bg-[#084735]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Cycle"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

function SelfAssessmentModal({
  review,
  onClose,
  onSaved,
}: {
  review: PerformanceReview;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selfScore, setSelfScore] = useState(3);
  const [selfAssessment, setSelfAssessment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const employeeName = getFullName(review.employee);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/performance/review", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: review.id,
          type: "self",
          selfScore,
          selfAssessment,
        }),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(getApiError(payload, "Failed to submit assessment."));
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to submit assessment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell>
      <div className="w-full max-w-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Self Assessment
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {employeeName} · {review.cycle.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Self Score: {selfScore}/5
            </label>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelfScore(score)}
                  className={[
                    "flex h-9 w-9 items-center justify-center text-sm font-semibold transition-colors",
                    selfScore >= score
                      ? "bg-[#F7A81B] text-[#0B5A43]"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                  ].join(" ")}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              required
              value={selfAssessment}
              onChange={(event) => setSelfAssessment(event.target.value)}
              placeholder="Summarize your achievements, challenges, and contributions."
              className="min-h-36 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0B5A43] text-white hover:bg-[#084735]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

function ManagerReviewModal({
  review,
  onClose,
  onSaved,
}: {
  review: PerformanceReview;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState({
    attendanceScore: 3,
    workQualityScore: 3,
    teamworkScore: 3,
    initiativeScore: 3,
    communicationScore: 3,
  });

  const [notes, setNotes] = useState({
    strengths: "",
    improvements: "",
    goals: "",
    reviewerNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const averageScore = useMemo(() => {
    const values = Object.values(scores);
    return values.reduce((total, value) => total + value, 0) / values.length;
  }, [scores]);

  const employeeName = getFullName(review.employee);

  const scoreFields: Array<{
    key: keyof typeof scores;
    label: string;
  }> = [
    { key: "attendanceScore", label: "Attendance" },
    { key: "workQualityScore", label: "Work Quality" },
    { key: "teamworkScore", label: "Teamwork" },
    { key: "initiativeScore", label: "Initiative" },
    { key: "communicationScore", label: "Communication" },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/performance/review", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: review.id,
          type: "reviewer",
          ...scores,
          ...notes,
        }),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(getApiError(payload, "Failed to submit review."));
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell>
      <div className="max-h-[calc(100dvh-5rem)] w-full max-w-2xl overflow-y-auto border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Manager Review
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {employeeName} · Average {averageScore.toFixed(1)}/5
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {scoreFields.map((field) => (
              <div key={field.key}>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {field.label}: {scores[field.key]}/5
                </label>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          [field.key]: score,
                        }))
                      }
                      className={[
                        "flex h-9 w-9 items-center justify-center text-sm font-semibold transition-colors",
                        scores[field.key] >= score
                          ? "bg-[#F7A81B] text-[#0B5A43]"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                      ].join(" ")}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <textarea
              value={notes.strengths}
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  strengths: event.target.value,
                }))
              }
              placeholder="Strengths"
              className="min-h-24 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />

            <textarea
              value={notes.improvements}
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  improvements: event.target.value,
                }))
              }
              placeholder="Areas for improvement"
              className="min-h-24 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />

            <textarea
              value={notes.goals}
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  goals: event.target.value,
                }))
              }
              placeholder="Next goals"
              className="min-h-24 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />

            <textarea
              value={notes.reviewerNotes}
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  reviewerNotes: event.target.value,
                }))
              }
              placeholder="Reviewer notes"
              className="min-h-24 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0B5A43] text-white hover:bg-[#084735]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export default function PerformancePage() {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [selfReview, setSelfReview] = useState<PerformanceReview | null>(null);
  const [managerReview, setManagerReview] = useState<PerformanceReview | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const cyclesResponse = await fetch("/api/performance/cycles", {
        cache: "no-store",
      });

      const cyclesPayload =
        await readJson<ApiListResponse<ReviewCycle>>(cyclesResponse);

      if (!cyclesResponse.ok) {
        throw new Error(
          getApiError(cyclesPayload, "Failed to load review cycles."),
        );
      }

      const reviewsResult = await fetchReviewsWithFallback();

      if (!reviewsResult.response.ok) {
        throw new Error(
          getApiError(reviewsResult.payload, "Failed to load reviews."),
        );
      }

      setCycles(extractList(cyclesPayload, "cycles"));
      setReviews(extractList(reviewsResult.payload, "reviews"));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load performance data.",
      );
      setCycles([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredReviews = useMemo(() => {
    if (selectedCycleId === "all") return reviews;

    return reviews.filter((review) => review.cycle.id === selectedCycleId);
  }, [reviews, selectedCycleId]);

  const activeCycles = cycles.filter((cycle) => cycle.status === "active");

  const completedReviews = reviews.filter(
    (review) => review.status === "reviewed" || review.status === "completed",
  );

  const pendingReviews = reviews.filter(
    (review) =>
      review.status === "draft" ||
      review.status === "pending" ||
      review.status === "self_submitted",
  );

  const averageScore =
    completedReviews.length > 0
      ? completedReviews.reduce(
          (total, review) => total + (review.overallScore ?? 0),
          0,
        ) / completedReviews.length
      : 0;

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Performance
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage review cycles, employee assessments, and performance
              scores.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateCycle(true)}
            className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Cycle
          </Button>
        </div>
      </header>

      {error && <ErrorBox message={error} />}

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Cycles"
          value={cycles.length}
          description="Total review cycles"
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <SummaryItem
          label="Active"
          value={activeCycles.length}
          description="Active cycles"
          icon={<Target className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Pending"
          value={pendingReviews.length}
          description="Reviews in progress"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="orange"
        />

        <SummaryItem
          label="Average"
          value={averageScore ? averageScore.toFixed(1) : "0.0"}
          description="Completed score"
          icon={<BarChart3 className="h-5 w-5" />}
          tone="green"
        />
      </section>

      {loading ? (
        <section className="border border-gray-200 bg-white px-4 py-16 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0B5A43]" />
          <p className="mt-3 text-sm text-gray-500">
            Loading performance data...
          </p>
        </section>
      ) : cycles.length === 0 && reviews.length === 0 ? (
        <EmptyState
          title="No performance data yet"
          description="Create your first review cycle to start tracking employee performance."
          icon={<Trophy className="h-6 w-6" />}
          action={
            <Button
              onClick={() => setShowCreateCycle(true)}
              className="bg-[#0B5A43] text-white hover:bg-[#084735]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          }
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
              <div>
                <h2 className="text-base font-semibold text-gray-950">
                  Review Cycles
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Filter reviews by cycle.
                </p>
              </div>
            </div>

            <div className="p-4">
              <button
                type="button"
                onClick={() => setSelectedCycleId("all")}
                className={[
                  "mb-3 flex w-full items-center justify-between border px-4 py-3 text-left text-sm transition-colors",
                  selectedCycleId === "all"
                    ? "border-[#0B5A43] bg-[#EAF5F0] text-[#0B5A43]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="font-semibold">All Cycles</span>
                <span>{reviews.length}</span>
              </button>

              {cycles.length === 0 ? (
                <div className="border border-dashed border-gray-200 px-4 py-10 text-center">
                  <CalendarDays className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-3 text-sm font-medium text-gray-800">
                    No cycles found
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a review cycle first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cycles.map((cycle) => {
                    const selected = selectedCycleId === cycle.id;

                    return (
                      <button
                        key={cycle.id}
                        type="button"
                        onClick={() => setSelectedCycleId(cycle.id)}
                        className={[
                          "w-full border p-4 text-left transition-colors",
                          selected
                            ? "border-[#0B5A43] bg-[#EAF5F0]"
                            : "border-gray-200 bg-white hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-950">
                              {cycle.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {CYCLE_TYPE_LABEL[cycle.type] ?? cycle.type}
                            </p>
                          </div>

                          <StatusBadge status={cycle.status} />
                        </div>

                        <p className="mt-3 text-xs text-gray-500">
                          {formatDate(cycle.startDate)} -{" "}
                          {formatDate(cycle.endDate)}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          {cycle._count?.reviews ?? 0} reviews
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-950">
                  Reviews
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredReviews.length} review
                  {filteredReviews.length === 1 ? "" : "s"} found.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void loadData()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
                  <ClipboardList className="h-6 w-6" />
                </div>

                <p className="mt-4 font-semibold text-gray-800">
                  No reviews found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  There are no reviews for the selected cycle.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3 font-semibold">Employee</th>
                      <th className="px-5 py-3 font-semibold">Cycle</th>
                      <th className="px-5 py-3 font-semibold">Reviewer</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Self</th>
                      <th className="px-5 py-3 font-semibold">Final</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReviews.map((review) => {
                      const employeeName = getFullName(review.employee);
                      const reviewerName = review.reviewer
                        ? getFullName(review.reviewer)
                        : "-";

                      const canSubmitSelf =
                        review.status === "draft" ||
                        review.status === "pending";

                      const canReview =
                        review.status === "self_submitted" ||
                        review.status === "pending";

                      return (
                        <tr
                          key={review.id}
                          className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#EAF5F0] text-[#0B5A43]">
                                <UserCircle className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-gray-950">
                                  {employeeName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {review.employee.position ?? "-"}
                                  {review.employee.department?.name
                                    ? ` · ${review.employee.department.name}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-800">
                              {review.cycle.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {CYCLE_TYPE_LABEL[review.cycle.type] ??
                                review.cycle.type}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {reviewerName}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={review.status} />
                          </td>

                          <td className="px-5 py-4">
                            <ScoreValue score={review.selfScore} />
                          </td>

                          <td className="px-5 py-4">
                            <ScoreValue score={review.overallScore} />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {canSubmitSelf && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelfReview(review)}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  Self
                                </Button>
                              )}

                              {canReview && (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[#0B5A43] text-white hover:bg-[#084735]"
                                  onClick={() => setManagerReview(review)}
                                >
                                  <Award className="mr-2 h-4 w-4" />
                                  Review
                                </Button>
                              )}

                              {!canSubmitSelf && !canReview && (
                                <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Done
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {showCreateCycle && (
        <CreateCycleModal
          onClose={() => setShowCreateCycle(false)}
          onCreated={() => void loadData()}
        />
      )}

      {selfReview && (
        <SelfAssessmentModal
          review={selfReview}
          onClose={() => setSelfReview(null)}
          onSaved={() => void loadData()}
        />
      )}

      {managerReview && (
        <ManagerReviewModal
          review={managerReview}
          onClose={() => setManagerReview(null)}
          onSaved={() => void loadData()}
        />
      )}
    </div>
  );
}
