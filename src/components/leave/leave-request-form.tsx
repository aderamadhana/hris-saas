"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Heart,
  Baby,
  Users,
  Star,
  AlertCircle,
  RefreshCw,
  Car,
  Plane,
  PhoneOff,
  Home,
  Globe,
  XCircle,
  FileText,
  Clock,
  Upload,
  X,
  Info,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  LEAVE_TYPES,
  LEAVE_CATEGORIES,
  getLeaveType,
  autoCalculateEndDate,
  getDurationLabel,
  calculateWorkingDays,
  calculateCalendarDays,
  LeaveCategory,
} from "@/src/lib/leave-types";

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Calendar,
  Heart,
  Baby,
  Users,
  Star,
  AlertCircle,
  RefreshCw,
  Car,
  Plane,
  PhoneOff,
  Home,
  Globe,
  XCircle,
  FileText,
};

function LeaveIcon({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) {
  const Icon = ICON_MAP[iconName] ?? FileText;
  return <Icon className={className} />;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  name: string;
  position: string;
}

interface LeaveBalance {
  annual: number;
  sick: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function LeaveRequestForm() {
  const router = useRouter();

  // Form state
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [delegateId, setDelegateId] = useState("");
  const [delegateNotes, setDelegateNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Remote data
  const [balance, setBalance] = useState<LeaveBalance>({ annual: 0, sick: 0 });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const leaveType = getLeaveType(leaveTypeId);

  // ─── Fetch leave balance ────────────────────────────────────────
  useEffect(() => {
    fetch("/api/leave/balance")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBalance(data.balance);
      })
      .catch(() => {})
      .finally(() => setLoadingBalance(false));
  }, []);

  // ─── Fetch employees for delegation ────────────────────────────
  useEffect(() => {
    if (!leaveType?.requiresDelegation) return;
    fetch("/api/employees/list")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEmployees(data.employees ?? []);
      })
      .catch(() => {});
  }, [leaveType?.requiresDelegation]);

  // ─── Auto-fill end date for special leave types ─────────────────
  useEffect(() => {
    if (!startDate || !leaveTypeId) return;
    if (leaveType?.autoCalculate) {
      setEndDate(autoCalculateEndDate(leaveTypeId, startDate));
    }
  }, [startDate, leaveTypeId, leaveType?.autoCalculate]);

  // ─── Reset dates when leave type changes ───────────────────────
  useEffect(() => {
    setStartDate("");
    setEndDate("");
    setStartTime("09:00");
    setEndTime("17:00");
    setDelegateId("");
    setDelegateNotes("");
    setFile(null);
    setError(null);
  }, [leaveTypeId]);

  // ─── Derived calculations ───────────────────────────────────────
  const totalHours = (() => {
    if (!leaveType?.requiresTime || !startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  })();

  const durationLabel =
    startDate && endDate
      ? getDurationLabel(
          leaveTypeId,
          startDate,
          endDate,
          totalHours || undefined,
        )
      : null;

  const remainingBalance = (() => {
    if (!leaveType || !startDate || !endDate) return null;
    if (leaveTypeId === "annual") {
      const requested = leaveType.includeWeekends
        ? calculateCalendarDays(new Date(startDate), new Date(endDate))
        : calculateWorkingDays(new Date(startDate), new Date(endDate));
      return balance.annual - requested;
    }
    return null;
  })();

  // ─── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!leaveTypeId) return setError("Please select a leave type.");
    if (!startDate) return setError("Please select a start date.");
    if (!endDate && !leaveType?.requiresTime)
      return setError("Please select an end date.");
    if (leaveType?.requiresTime && !startTime)
      return setError("Please enter the start time.");
    if (leaveType?.requiresTime && !endTime)
      return setError("Please enter the end time.");
    if (leaveType?.requiresTime && totalHours <= 0)
      return setError("End time must be after start time.");
    if (reason.trim().length < 10)
      return setError("Reason must be at least 10 characters.");
    if (leaveType?.requiresDocument && !file)
      return setError("A supporting document is required for this leave type.");
    if (leaveType?.requiresDelegation && !delegateId)
      return setError("Please select someone to delegate your tasks to.");
    if (remainingBalance !== null && remainingBalance < 0)
      return setError("Insufficient leave balance.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("leaveTypeId", leaveTypeId);
      form.append("startDate", startDate);
      form.append("endDate", endDate || startDate);
      form.append("reason", reason);
      if (leaveType?.requiresTime) {
        form.append("startTime", startTime);
        form.append("endTime", endTime);
        form.append("totalHours", totalHours.toString());
      }
      if (delegateId) {
        form.append("delegateId", delegateId);
        form.append("delegateNotes", delegateNotes);
      }
      if (file) form.append("attachment", file);

      const res = await fetch("/api/leave/request", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error ?? "Failed to submit leave request.");

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/leave"), 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Group leave types by category ─────────────────────────────
  const categories = Object.keys(LEAVE_CATEGORIES) as LeaveCategory[];

  // ─── Success state ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <FileText className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Request Submitted!
        </h2>
        <p className="text-gray-500">
          Your leave request has been sent for approval. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Leave Balance ── */}
      {!loadingBalance && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Your Leave Balance
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {balance.annual}
              </p>
              <p className="text-xs text-gray-500">Annual days remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">∞</p>
              <p className="text-xs text-gray-500">Sick leave (unlimited)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Leave Type ── */}
      <div className="space-y-2">
        <Label htmlFor="leaveType">
          Leave Type <span className="text-red-500">*</span>
        </Label>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger id="leaveType" className="h-11">
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => {
              const items = LEAVE_TYPES.filter((t) => t.category === cat);
              if (!items.length) return null;
              return (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {LEAVE_CATEGORIES[cat]}
                  </SelectLabel>
                  {items.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      <div className="flex items-center gap-2">
                        <LeaveIcon
                          iconName={lt.iconName}
                          className="h-4 w-4 text-gray-500"
                        />
                        <span>{lt.label}</span>
                        {lt.maxDays && (
                          <span className="ml-auto text-xs text-gray-400">
                            {lt.maxDays}{" "}
                            {lt.includeWeekends ? "days" : "working days"}
                          </span>
                        )}
                        {!lt.isPaid && (
                          <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                            Unpaid
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* ── Info Card ── */}
      {leaveType && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <LeaveIcon
                iconName={leaveType.iconName}
                className="h-4 w-4 text-blue-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900">{leaveType.label}</p>
              <p className="mt-0.5 text-sm text-blue-700">
                {leaveType.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${leaveType.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {leaveType.isPaid ? "Paid" : "Unpaid"}
                </span>
                {leaveType.maxDays && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    Max {leaveType.maxDays}{" "}
                    {leaveType.includeWeekends
                      ? "calendar days"
                      : "working days"}
                  </span>
                )}
                {leaveType.requiresDocument && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Document required
                  </span>
                )}
                {leaveType.autoCalculate && (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                    Dates auto-calculated
                  </span>
                )}
                {leaveType.requiresTime && (
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    Time required
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dates ── */}
      {leaveTypeId && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11"
            />
          </div>
          {!leaveType?.requiresTime && (
            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
                {leaveType?.autoCalculate && (
                  <span className="ml-2 text-xs font-normal text-purple-600">
                    (auto-filled)
                  </span>
                )}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  !leaveType?.autoCalculate && setEndDate(e.target.value)
                }
                disabled={leaveType?.autoCalculate}
                className="h-11 disabled:opacity-70"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Time (Out of Office) ── */}
      {leaveType?.requiresTime && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">
              Start Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">
              End Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11"
            />
          </div>
          {totalHours > 0 && (
            <div className="col-span-2 rounded-lg bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700">
              <Clock className="mr-2 inline h-4 w-4" />
              Duration: {totalHours.toFixed(1)} hour
              {totalHours !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* ── Duration Summary ── */}
      {durationLabel && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <Calendar className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-gray-500">Requested duration</p>
              <p className="font-semibold text-gray-900">{durationLabel}</p>
            </div>
            {remainingBalance !== null && (
              <div>
                <p className="text-xs text-gray-500">
                  Remaining after approval
                </p>
                <p
                  className={`font-semibold ${remainingBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {remainingBalance} day{remainingBalance !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delegation ── */}
      {leaveType?.requiresDelegation && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <p className="font-semibold text-amber-900">Task Delegation</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delegate">
              Delegate to <span className="text-red-500">*</span>
            </Label>
            <Select value={delegateId} onValueChange={setDelegateId}>
              <SelectTrigger id="delegate" className="h-11">
                <SelectValue placeholder="Select a colleague" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delegateNotes">Delegation Notes</Label>
            <Textarea
              id="delegateNotes"
              value={delegateNotes}
              onChange={(e) => setDelegateNotes(e.target.value)}
              placeholder="Describe the tasks or handover instructions…"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* ── Reason ── */}
      <div className="space-y-2">
        <Label htmlFor="reason">
          Reason <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please explain the reason for your leave request…"
          rows={4}
        />
        <p className="text-xs text-gray-400">
          {reason.length} character{reason.length !== 1 ? "s" : ""} (minimum 10)
        </p>
      </div>

      {/* ── Document Upload ── */}
      <div className="space-y-2">
        <Label htmlFor="attachment">
          Supporting Document
          {leaveType?.requiresDocument && (
            <span className="ml-1 text-red-500">*</span>
          )}
          {!leaveType?.requiresDocument && (
            <span className="ml-1 text-xs font-normal text-gray-400">
              (optional)
            </span>
          )}
        </Label>
        {file ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>{file.name}</span>
              <span className="text-gray-400">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="attachment"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-6 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50"
          >
            <Upload className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PDF, JPG, PNG — max 5 MB
            </p>
            <input
              id="attachment"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > 5 * 1024 * 1024) {
                  setError("File size must not exceed 5 MB.");
                  return;
                }
                setFile(f ?? null);
              }}
            />
          </label>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1 h-11">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Leave Request"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-6"
          onClick={() => router.push("/dashboard/leave")}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
