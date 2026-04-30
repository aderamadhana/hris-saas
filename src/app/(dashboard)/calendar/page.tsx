"use client";

// src/app/(dashboard)/dashboard/calendar/page.tsx

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Flag,
  Link2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";

const HOLIDAY_IMPORT_YEAR = 2026;

interface CompanyEvent {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  color: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  isNational: boolean;
  location?: string | null;
  meetingUrl?: string | null;
  targetRoles: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  targetDepartment?: {
    name: string;
  } | null;
}

type CalendarPayload =
  | CompanyEvent[]
  | {
      success?: boolean;
      data?: CompanyEvent[];
      events?: CompanyEvent[];
      error?: string;
    };

const EVENT_TYPES: Array<{
  value: string;
  label: string;
  icon: ElementType;
  color: string;
  tone: "red" | "blue" | "purple" | "orange" | "pink" | "green";
}> = [
  {
    value: "holiday",
    label: "Holiday",
    icon: Star,
    color: "#EF4444",
    tone: "red",
  },
  {
    value: "event",
    label: "Event",
    icon: Calendar,
    color: "#0B5A43",
    tone: "green",
  },
  {
    value: "meeting",
    label: "Meeting",
    icon: Users,
    color: "#2563EB",
    tone: "blue",
  },
  {
    value: "reminder",
    label: "Reminder",
    icon: AlertCircle,
    color: "#F7A81B",
    tone: "orange",
  },
  {
    value: "birthday",
    label: "Birthday",
    icon: Coffee,
    color: "#EC4899",
    tone: "pink",
  },
  {
    value: "training",
    label: "Training",
    icon: Briefcase,
    color: "#10B981",
    tone: "green",
  },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TARGET_ROLE_LABEL: Record<string, string> = {
  all: "All employees",
  employee: "Employees only",
  manager: "Managers and above",
  hr: "HR and admins",
  admin: "Admins",
  owner: "Owners",
};

function getTypeConfig(type: string) {
  return EVENT_TYPES.find((item) => item.value === type) ?? EVENT_TYPES[1];
}

function extractEvents(payload: CalendarPayload | null) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;

  if (Array.isArray(payload.events)) return payload.events;

  return [];
}

function getPayloadError(payload: unknown, fallback: string) {
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

function parseDate(value: string) {
  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatEventDateRange(event: CompanyEvent) {
  const start = formatDate(event.startDate);
  const end = formatDate(event.endDate);

  if (start === end) return start;

  return `${start} - ${end}`;
}

function isSameDay(date: Date, year: number, month: number, day: number) {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
}

function isEventOnDay(
  event: CompanyEvent,
  year: number,
  month: number,
  day: number,
) {
  const target = new Date(year, month, day);
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);

  target.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return target >= start && target <= end;
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

function SummaryItem({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  tone?: "default" | "green" | "orange" | "red";
}) {
  const iconClass = {
    default: "border-gray-200 bg-gray-50 text-gray-600",
    green: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    orange: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  const valueClass = {
    default: "text-gray-950",
    green: "text-[#0B5A43]",
    orange: "text-[#7A5A00]",
    red: "text-red-700",
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
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <Calendar className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "event",
    color: "#0B5A43",
    startDate: today,
    endDate: today,
    isAllDay: true,
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    meetingUrl: "",
    targetRoles: "all",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeChange = (type: string) => {
    const config = getTypeConfig(type);

    setForm((current) => ({
      ...current,
      type,
      color: config.color,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.startDate || !form.endDate) {
      setError("Title, start date, and end date are required.");
      return;
    }

    if (parseDate(form.endDate) < parseDate(form.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (!form.isAllDay && form.endTime <= form.startTime) {
      setError("End time must be later than start time.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim() || null,
          meetingUrl: form.meetingUrl.trim() || null,
          startTime: form.isAllDay ? null : form.startTime,
          endTime: form.isAllDay ? null : form.endTime,
        }),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(getPayloadError(payload, "Failed to create event."));
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell>
      <div className="w-full max-w-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              New Calendar Event
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add a company event, holiday, meeting, reminder, or training.
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
              Event Title
            </label>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Example: Quarterly Town Hall"
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Event Type
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              {EVENT_TYPES.map(({ value, label, icon: Icon, color }) => {
                const active = form.type === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleTypeChange(value)}
                    className={[
                      "flex h-10 items-center gap-2 border px-3 text-left text-xs font-semibold transition-colors",
                      active
                        ? "border-[#0B5A43] bg-[#EAF5F0] text-[#0B5A43]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: active ? "#0B5A43" : color }}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
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
                    endDate:
                      parseDate(current.endDate) < parseDate(event.target.value)
                        ? event.target.value
                        : current.endDate,
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
                min={form.startDate}
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

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isAllDay}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isAllDay: event.target.checked,
                }))
              }
            />
            All-day event
          </label>

          {!form.isAllDay && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Example: Meeting Room A"
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Meeting Link
              </label>
              <input
                value={form.meetingUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    meetingUrl: event.target.value,
                  }))
                }
                placeholder="https://meet.google.com/..."
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Audience
            </label>
            <select
              value={form.targetRoles}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  targetRoles: event.target.value,
                }))
              }
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            >
              <option value="all">All employees</option>
              <option value="employee">Employees only</option>
              <option value="manager">Managers and above</option>
              <option value="hr">HR and admins</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Add useful details, agenda, or preparation notes."
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
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
                  Saving...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

function EventCard({
  event,
  canDelete,
  onDelete,
}: {
  event: CompanyEvent;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const config = getTypeConfig(event.type);
  const Icon = config.icon;
  const color = event.color || config.color;

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            style={{
              backgroundColor: `${color}18`,
              color,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-gray-950">
                {event.title}
              </p>

              {event.isNational && (
                <span className="bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                  National
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {formatEventDateRange(event)}
            </p>
          </div>
        </div>

        {canDelete && !event.isNational && (
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete event"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-gray-500">
        {!event.isAllDay && event.startTime && (
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {event.startTime} - {event.endTime || "No end time"}
          </p>
        )}

        {event.location && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </p>
        )}

        {event.meetingUrl && (
          <a
            href={event.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium text-[#0B5A43] hover:underline"
          >
            <Link2 className="h-3.5 w-3.5" />
            Open meeting link
          </a>
        )}

        {event.targetRoles && (
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {TARGET_ROLE_LABEL[event.targetRoles] ?? event.targetRoles}
          </p>
        )}
      </div>

      {event.description && (
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {event.description}
        </p>
      )}
    </div>
  );
}

function CalendarGrid({
  year,
  month,
  events,
  selectedDay,
  onDayClick,
}: {
  year: number;
  month: number;
  events: CompanyEvent[];
  selectedDay: number | null;
  onDayClick: (day: number) => void;
}) {
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const eventsByDay = useMemo(() => {
    const map: Record<number, CompanyEvent[]> = {};

    events.forEach((event) => {
      const start = parseDate(event.startDate);
      const end = parseDate(event.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      for (
        const dayCursor = new Date(start);
        dayCursor <= end;
        dayCursor.setDate(dayCursor.getDate() + 1)
      ) {
        if (
          dayCursor.getFullYear() === year &&
          dayCursor.getMonth() === month
        ) {
          const day = dayCursor.getDate();
          map[day] = map[day] ?? [];
          map[day].push(event);
        }
      }
    });

    return map;
  }, [events, year, month]);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={[
              "px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide",
              index === 0
                ? "text-red-500"
                : index === 6
                  ? "text-blue-500"
                  : "text-gray-500",
            ].join(" ")}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[96px] border-b border-r border-gray-100 bg-gray-50/60"
              />
            );
          }

          const dayEvents = eventsByDay[day] ?? [];
          const isToday = isSameDay(today, year, month, day);
          const isSelected = selectedDay === day;
          const isSunday = index % 7 === 0;
          const isSaturday = index % 7 === 6;
          const hasHoliday = dayEvents.some(
            (event) => event.type === "holiday" || event.isNational,
          );

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick(day)}
              className={[
                "min-h-[96px] border-b border-r border-gray-100 bg-white p-2 text-left transition-colors hover:bg-gray-50",
                isSelected ? "bg-[#EAF5F0]" : "",
                hasHoliday && !isSelected ? "bg-red-50/60" : "",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center text-xs font-semibold",
                    isToday
                      ? "bg-[#0B5A43] text-white"
                      : hasHoliday || isSunday
                        ? "text-red-600"
                        : isSaturday
                          ? "text-blue-600"
                          : "text-gray-700",
                  ].join(" ")}
                >
                  {day}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const config = getTypeConfig(event.type);
                  const color = event.color || config.color;

                  return (
                    <div
                      key={event.id}
                      className="truncate border-l-2 bg-gray-50 px-1.5 py-1 text-[10px] font-medium leading-tight text-gray-700"
                      style={{
                        borderLeftColor: color,
                      }}
                    >
                      {event.title}
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div className="px-1.5 text-[10px] text-gray-400">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();

  const [year, setYear] = useState(HOLIDAY_IMPORT_YEAR);
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate(),
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [isHRAdmin, setIsHRAdmin] = useState(false);
  const [seedingHolidays, setSeedingHolidays] = useState(false);

  const fetchEvents = async (targetYear = year, targetMonth = month) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/calendar?year=${targetYear}&month=${targetMonth + 1}`,
        {
          cache: "no-store",
        },
      );

      const payload = await readJson<CalendarPayload>(response);

      if (!response.ok) {
        throw new Error(getPayloadError(payload, "Failed to load events."));
      }

      setEvents(extractEvents(payload));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        cache: "no-store",
      });

      const payload = await readJson<{
        success?: boolean;
        data?: {
          role?: string;
        };
      }>(response);

      const role = payload?.data?.role ?? "";

      setIsHRAdmin(["admin", "hr", "owner"].includes(role));
    } catch {
      setIsHRAdmin(false);
    }
  };

  useEffect(() => {
    void fetchEvents(year, month);
  }, [year, month]);

  useEffect(() => {
    void fetchProfile();
  }, []);

  const goToPreviousMonth = () => {
    setSelectedDay(null);

    if (month === 0) {
      setYear((current) => current - 1);
      setMonth(11);
      return;
    }

    setMonth((current) => current - 1);
  };

  const goToNextMonth = () => {
    setSelectedDay(null);

    if (month === 11) {
      setYear((current) => current + 1);
      setMonth(0);
      return;
    }

    setMonth((current) => current + 1);
  };

  const goToToday = () => {
    const current = new Date();

    setYear(current.getFullYear());
    setMonth(current.getMonth());
    setSelectedDay(current.getDate());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event? This action cannot be undone.")) {
      return;
    }

    const previousEvents = events;

    setEvents((current) => current.filter((event) => event.id !== id));

    try {
      const response = await fetch(`/api/calendar?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event.");
      }
    } catch {
      setEvents(previousEvents);
      setError("Failed to delete event.");
    }
  };

  const seedNationalHolidays = async () => {
    setSeedingHolidays(true);
    setError("");

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seedNationalHolidays: true,
          year: HOLIDAY_IMPORT_YEAR,
        }),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(
          getPayloadError(payload, "Failed to import 2026 national holidays."),
        );
      }

      setYear(HOLIDAY_IMPORT_YEAR);
      await fetchEvents(HOLIDAY_IMPORT_YEAR, month);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import 2026 national holidays.",
      );
    } finally {
      setSeedingHolidays(false);
    }
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];

    return events
      .filter((event) => isEventOnDay(event, year, month, selectedDay))
      .sort(
        (a, b) =>
          (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00") ||
          a.title.localeCompare(b.title),
      );
  }, [events, selectedDay, year, month]);

  const upcomingEvents = useMemo(() => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const nextSevenDays = new Date(startToday);
    nextSevenDays.setDate(nextSevenDays.getDate() + 7);

    return events
      .filter((event) => {
        const eventDate = parseDate(event.startDate);
        eventDate.setHours(0, 0, 0, 0);

        return eventDate >= startToday && eventDate <= nextSevenDays;
      })
      .sort(
        (a, b) =>
          parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime(),
      )
      .slice(0, 5);
  }, [events]);

  const holidaysCount = events.filter(
    (event) => event.type === "holiday" || event.isNational,
  ).length;

  const meetingsCount = events.filter(
    (event) => event.type === "meeting",
  ).length;

  const selectedDateTitle = selectedDay
    ? `${MONTHS[month]} ${selectedDay}, ${year}`
    : "Select a date";

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View company schedules, holidays, meetings, and important events.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={goToToday}
              className="w-full sm:w-auto"
            >
              Today
            </Button>

            {isHRAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={seedNationalHolidays}
                disabled={seedingHolidays}
                className="w-full sm:w-auto"
              >
                {seedingHolidays ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Import 2026 Holidays
                  </>
                )}
              </Button>
            )}

            {isHRAdmin && (
              <Button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Events"
          value={events.length}
          description="This month"
          icon={<Calendar className="h-5 w-5" />}
        />

        <SummaryItem
          label="Holidays"
          value={holidaysCount}
          description="Company and national"
          icon={<Star className="h-5 w-5" />}
          tone={holidaysCount > 0 ? "red" : "default"}
        />

        <SummaryItem
          label="Meetings"
          value={meetingsCount}
          description="Scheduled meetings"
          icon={<Users className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Upcoming"
          value={upcomingEvents.length}
          description="Next 7 days"
          icon={<Clock className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-9 w-9 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-950">
                {MONTHS[month]} {year}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {events.length} event{events.length === 1 ? "" : "s"} this month
              </p>
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-9 w-9 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-4 py-24 text-sm text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0B5A43]" />
              Loading calendar...
            </div>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              events={events}
              selectedDay={selectedDay}
              onDayClick={setSelectedDay}
            />
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 px-5 py-4">
            {EVENT_TYPES.map(({ value, label, color }) => (
              <div
                key={value}
                className="flex items-center gap-2 text-xs text-gray-500"
              >
                <span
                  className="h-2.5 w-2.5"
                  style={{ backgroundColor: color }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-950">
                {selectedDateTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedDayEvents.length} event
                {selectedDayEvents.length === 1 ? "" : "s"} selected.
              </p>
            </div>

            {selectedDayEvents.length === 0 ? (
              <EmptyState
                title="No events on this date"
                description="Select another date or create a new event."
              />
            ) : (
              <div className="space-y-3 p-4">
                {selectedDayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    canDelete={isHRAdmin}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
              <div>
                <h2 className="text-base font-semibold text-gray-950">
                  Upcoming
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Events in the next 7 days.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchEvents(year, month)}
                className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Refresh events"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="No upcoming events"
                description="There are no events scheduled in the next 7 days."
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingEvents.map((event) => {
                  const config = getTypeConfig(event.type);
                  const Icon = config.icon;
                  const date = parseDate(event.startDate);

                  return (
                    <div key={event.id} className="flex gap-3 px-5 py-4">
                      <div className="w-12 shrink-0 text-center">
                        <p className="text-lg font-semibold leading-5 text-gray-950">
                          {date.getDate()}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                          {MONTHS[date.getMonth()].slice(0, 3)}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4 shrink-0"
                            style={{ color: event.color || config.color }}
                          />
                          <p className="truncate text-sm font-semibold text-gray-950">
                            {event.title}
                          </p>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {event.isAllDay
                            ? "All day"
                            : event.startTime || "No time"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-950">
                Monthly Summary
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Event categories this month.
              </p>
            </div>

            <div className="space-y-3 p-5">
              {EVENT_TYPES.map(({ value, label, color }) => {
                const count = events.filter(
                  (event) => event.type === value,
                ).length;

                if (count === 0) return null;

                return (
                  <div
                    key={value}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-gray-600">{label}</span>
                    </div>

                    <span className="font-semibold text-gray-950">{count}</span>
                  </div>
                );
              })}

              {events.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">
                  No events this month.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => void fetchEvents(year, month)}
        />
      )}
    </div>
  );
}
