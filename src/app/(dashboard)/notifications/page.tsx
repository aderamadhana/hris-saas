"use client";

// src/app/(dashboard)/notifications/page.tsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  Clock,
  DollarSign,
  Info,
  Loader2,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  resourceType?: string | null;
  resourceId?: string | null;
}

type FilterType = "all" | "unread";

const TYPE_LABEL: Record<string, string> = {
  leave_submitted: "Pengajuan Cuti",
  leave_approved: "Cuti Disetujui",
  leave_rejected: "Cuti Ditolak",
  payroll_generated: "Payslip",
  payroll_approved: "Payroll Disetujui",
  payroll_paid: "Gaji Dibayar",
  attendance_reminder: "Pengingat Absensi",
  welcome: "Selamat Datang",
  system: "Sistem",
};

const FILTERS: Array<{ value: FilterType; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "unread", label: "Belum dibaca" },
];

function getTypeLabel(type: string) {
  return TYPE_LABEL[type] || formatText(type);
}

function getTypeIcon(type: string) {
  if (["leave_submitted", "leave_approved", "leave_rejected"].includes(type)) {
    return <Calendar className="h-4 w-4" />;
  }

  if (
    ["payroll_generated", "payroll_approved", "payroll_paid"].includes(type)
  ) {
    return <DollarSign className="h-4 w-4" />;
  }

  if (type === "attendance_reminder") {
    return <Clock className="h-4 w-4" />;
  }

  if (type === "welcome") {
    return <Users className="h-4 w-4" />;
  }

  return <Info className="h-4 w-4" />;
}

function getTypeTone(type: string) {
  if (["leave_approved", "payroll_paid"].includes(type)) {
    return "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]";
  }

  if (type === "leave_rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["leave_submitted", "attendance_reminder"].includes(type)) {
    return "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]";
  }

  return "border-gray-200 bg-gray-50 text-gray-600";
}

function getResourceHref(notification: Notification) {
  const { resourceType, resourceId } = notification;

  if (!resourceType || !resourceId) return null;

  if (resourceType === "leave") return `/leave/${resourceId}`;
  if (resourceType === "payroll" || resourceType === "payslip") {
    return `/payslip/${resourceId}`;
  }
  if (resourceType === "attendance") return "/attendance";

  return null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  async function fetchNotifications() {
    setLoading(true);
    setError(null);

    try {
      const url =
        filter === "unread"
          ? "/api/notifications?limit=50&unread=true"
          : "/api/notifications?limit=50";

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Gagal memuat notifikasi.");
      }

      const items = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      setNotifications(items);
      setUnreadCount(Number(data?.unreadCount ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function markAllAsRead() {
    if (unreadCount <= 0) return;

    setMarkingAll(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Gagal menandai semua notifikasi.");
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menandai semua notifikasi.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneAsRead(notification: Notification) {
    if (notification.isRead) return;

    setMarkingId(notification.id);
    setError(null);

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Gagal menandai notifikasi.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menandai notifikasi.",
      );
    } finally {
      setMarkingId(null);
    }
  }

  const groupedNotifications = useMemo(() => {
    return notifications.reduce<Record<string, Notification[]>>(
      (acc, notification) => {
        const day = formatSafeDate(notification.createdAt, "dd MMMM yyyy");

        if (!acc[day]) {
          acc[day] = [];
        }

        acc[day].push(notification);
        return acc;
      },
      {},
    );
  }, [notifications]);

  const hasNotifications = notifications.length > 0;

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Notifikasi
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} notifikasi belum dibaca`
                  : "Semua notifikasi sudah dibaca"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              className="inline-flex items-center justify-center border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center justify-center border border-[#0B5A43]/30 px-3 py-2 text-sm font-semibold text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="mr-2 h-4 w-4" />
                )}
                Tandai semua dibaca
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="flex gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const isActive = filter === item.value;
              const count =
                item.value === "all" ? notifications.length : unreadCount;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={
                    isActive
                      ? "border border-[#0B5A43] bg-[#0B5A43] px-3 py-1.5 text-xs font-semibold text-white"
                      : "border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0B5A43]/40 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
                  }
                >
                  {item.label}{" "}
                  <span
                    className={isActive ? "text-white/75" : "text-gray-400"}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0B5A43]"
            >
              <X className="h-3.5 w-3.5" />
              Reset filter
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : !hasNotifications ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedNotifications).map(([day, items]) => (
              <div key={day}>
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {day}
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      marking={markingId === notification.id}
                      onMarkRead={() => markOneAsRead(notification)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationRow({
  notification,
  marking,
  onMarkRead,
}: {
  notification: Notification;
  marking: boolean;
  onMarkRead: () => void;
}) {
  const href = getResourceHref(notification);

  return (
    <div
      className={
        notification.isRead
          ? "grid gap-3 p-4 hover:bg-gray-50 sm:grid-cols-[1fr_auto] sm:items-start"
          : "grid gap-3 border-l-4 border-l-[#0B5A43] bg-[#EAF5F0]/40 p-4 hover:bg-[#EAF5F0]/70 sm:grid-cols-[1fr_auto] sm:items-start"
      }
    >
      <div className="flex min-w-0 gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${getTypeTone(
            notification.type,
          )}`}
        >
          {getTypeIcon(notification.type)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {getTypeLabel(notification.type)}
            </span>

            {!notification.isRead && (
              <span className="border border-[#0B5A43]/20 bg-[#EAF5F0] px-2 py-0.5 text-[11px] font-semibold text-[#0B5A43]">
                Baru
              </span>
            )}

            <span className="text-xs text-gray-400">
              {formatDistanceSafe(notification.createdAt)}
            </span>
          </div>

          <p
            className={
              notification.isRead
                ? "mt-2 text-sm font-medium text-gray-800"
                : "mt-2 text-sm font-semibold text-gray-950"
            }
          >
            {notification.title}
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {notification.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        {!notification.isRead && (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={marking}
            className="inline-flex items-center justify-center border border-[#0B5A43]/30 px-3 py-2 text-xs font-semibold text-[#0B5A43] hover:border-[#0B5A43] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {marking ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-3.5 w-3.5" />
            )}
            Dibaca
          </button>
        )}

        {href && (
          <Link
            href={href}
            className="inline-flex items-center justify-center border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#0B5A43] hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
          >
            Buka
          </Link>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center px-4 py-16">
      <div className="text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0B5A43]" />
        <p className="mt-3 text-sm text-gray-500">Memuat notifikasi...</p>
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <Bell className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">
        {filter === "unread"
          ? "Tidak ada notifikasi belum dibaca"
          : "Belum ada notifikasi"}
      </p>

      <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
        {filter === "unread"
          ? "Semua notifikasi sudah dibaca."
          : "Notifikasi sistem akan muncul di sini."}
      </p>
    </div>
  );
}

function formatSafeDate(value: string, pattern: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal tidak valid";
  }

  return format(date, pattern, { locale: id });
}

function formatDistanceSafe(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: id,
  });
}

function formatText(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
