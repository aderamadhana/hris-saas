"use client";

// src/app/(dashboard)/dashboard/announcements/page.tsx

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Eye,
  Info,
  Loader2,
  Megaphone,
  Pin,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  targetRoles: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isRead: boolean;
  readAt?: string | null;
  _count?: {
    reads?: number;
  };
  author?: {
    firstName: string;
    lastName: string;
    position?: string | null;
  } | null;
  targetDepartment?: {
    name: string;
  } | null;
  createdAt: string;
}

type AnnouncementPayload =
  | Announcement[]
  | {
      success?: boolean;
      data?: Announcement[];
      announcements?: Announcement[];
      error?: string;
    };

const BRAND_GREEN = "#0B5A43";
const BRAND_ORANGE = "#F7A81B";

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: ElementType;
    badgeClass: string;
    iconClass: string;
    activeClass: string;
  }
> = {
  info: {
    label: "Info",
    icon: Info,
    badgeClass: "bg-blue-50 text-blue-700",
    iconClass: "bg-blue-50 text-blue-700",
    activeClass: "bg-blue-600 text-white",
  },
  warning: {
    label: "Warning",
    icon: AlertCircle,
    badgeClass: "bg-yellow-50 text-yellow-700",
    iconClass: "bg-yellow-50 text-yellow-700",
    activeClass: "bg-yellow-600 text-white",
  },
  urgent: {
    label: "Urgent",
    icon: Bell,
    badgeClass: "bg-red-50 text-red-700",
    iconClass: "bg-red-50 text-red-700",
    activeClass: "bg-red-600 text-white",
  },
  event: {
    label: "Event",
    icon: Calendar,
    badgeClass: "bg-[#EAF5F0] text-[#0B5A43]",
    iconClass: "bg-[#EAF5F0] text-[#0B5A43]",
    activeClass: "bg-[#0B5A43] text-white",
  },
};

const TARGET_ROLE_LABEL: Record<string, string> = {
  all: "All employees",
  employee: "Employees only",
  manager: "Managers and above",
  hr: "HR and admins",
  admin: "Admins",
  owner: "Owners",
};

function extractAnnouncements(payload: AnnouncementPayload | null) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;

  if (Array.isArray(payload.announcements)) return payload.announcements;

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

function getAuthorName(announcement: Announcement) {
  const firstName = announcement.author?.firstName ?? "";
  const lastName = announcement.author?.lastName ?? "";
  return `${firstName} ${lastName}`.trim() || "System";
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

function timeAgo(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) return "-";

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(value);
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
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white px-4 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <Megaphone className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

function CreateAnnouncementModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "info",
    isPinned: false,
    isPublished: true,
    targetRoles: "all",
    expiresAt: "",
    attachmentUrl: "",
    attachmentName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and message are required.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          content: form.content.trim(),
          expiresAt: form.expiresAt || null,
          attachmentUrl: form.attachmentUrl.trim() || null,
          attachmentName: form.attachmentName.trim() || null,
        }),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(
          getPayloadError(payload, "Failed to create announcement."),
        );
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create announcement.",
      );
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
              New Announcement
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Share important updates with the right audience.
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
              Title
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
              placeholder="Example: Office closure for public holiday"
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              required
              rows={6}
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="Write the announcement clearly. Include dates, actions needed, and who it applies to."
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
                {Object.entries(TYPE_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>

            <div className="flex items-end gap-4 pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPinned: event.target.checked,
                    }))
                  }
                />
                Pin to top
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPublished: event.target.checked,
                    }))
                  }
                />
                Publish now
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Attachment URL
              </label>
              <input
                value={form.attachmentUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    attachmentUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Attachment Name
              </label>
              <input
                value={form.attachmentName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    attachmentName: event.target.value,
                  }))
                }
                placeholder="Policy document"
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
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
              ) : form.isPublished ? (
                "Publish"
              ) : (
                "Save Draft"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

function AnnouncementItem({
  announcement,
  isHRAdmin,
  onRead,
  onDelete,
}: {
  announcement: Announcement;
  isHRAdmin: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const config = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;

  const authorName = getAuthorName(announcement);
  const readCount = announcement._count?.reads ?? 0;
  const targetLabel =
    TARGET_ROLE_LABEL[announcement.targetRoles] ?? announcement.targetRoles;

  const handleToggle = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded && !announcement.isRead) {
      onRead(announcement.id);
    }
  };

  return (
    <article
      className={[
        "border border-gray-200 bg-white transition-colors",
        !announcement.isRead ? "border-l-4 border-l-[#F7A81B]" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-gray-50"
      >
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center ${config.iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {announcement.isPinned && (
                  <Pin className="h-3.5 w-3.5 text-[#7A5A00]" />
                )}

                <h3
                  className={[
                    "truncate text-sm font-semibold",
                    announcement.isRead ? "text-gray-800" : "text-gray-950",
                  ].join(" ")}
                >
                  {announcement.title}
                </h3>

                {!announcement.isRead && (
                  <span className="h-2 w-2 bg-[#F7A81B]" />
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span
                  className={`inline-flex px-2 py-1 font-semibold ${config.badgeClass}`}
                >
                  {config.label}
                </span>
                <span>{authorName}</span>
                <span>
                  {timeAgo(announcement.publishedAt ?? announcement.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {targetLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {readCount} read
                </span>
              </div>
            </div>

            <ChevronRight
              className={[
                "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                expanded ? "rotate-90" : "",
              ].join(" ")}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="max-w-4xl">
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {announcement.content}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {announcement.expiresAt && (
                <span>Expires on {formatDate(announcement.expiresAt)}</span>
              )}

              {announcement.targetDepartment?.name && (
                <span>Department: {announcement.targetDepartment.name}</span>
              )}

              {announcement.author?.position && (
                <span>Author role: {announcement.author.position}</span>
              )}
            </div>

            {announcement.attachmentUrl && (
              <a
                href={announcement.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0B5A43] hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                {announcement.attachmentName || "Open attachment"}
              </a>
            )}

            {isHRAdmin && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this announcement? This action cannot be undone.",
                      )
                    ) {
                      onDelete(announcement.id);
                    }
                  }}
                  className="inline-flex h-8 items-center gap-2 px-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isHRAdmin, setIsHRAdmin] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/announcements", {
        cache: "no-store",
      });

      const payload = await readJson<AnnouncementPayload>(response);

      if (!response.ok) {
        throw new Error(
          getPayloadError(payload, "Failed to load announcements."),
        );
      }

      setAnnouncements(extractAnnouncements(payload));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load announcements.",
      );
      setAnnouncements([]);
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

      setIsHRAdmin(["admin", "hr", "owner", "manager"].includes(role));
    } catch {
      setIsHRAdmin(false);
    }
  };

  useEffect(() => {
    void fetchAnnouncements();
    void fetchProfile();
  }, []);

  const handleRead = async (announcementId: string) => {
    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === announcementId
          ? {
              ...announcement,
              isRead: true,
            }
          : announcement,
      ),
    );

    try {
      await fetch("/api/announcements/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ announcementId }),
      });
    } catch {
      // Optimistic UI is enough here.
    }
  };

  const handleDelete = async (id: string) => {
    const previous = announcements;

    setAnnouncements((current) =>
      current.filter((announcement) => announcement.id !== id),
    );

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete announcement.");
      }
    } catch {
      setAnnouncements(previous);
      setError("Failed to delete announcement.");
    }
  };

  const unreadCount = announcements.filter(
    (announcement) => !announcement.isRead,
  ).length;

  const pinnedCount = announcements.filter(
    (announcement) => announcement.isPinned,
  ).length;

  const readCount = announcements.filter(
    (announcement) => announcement.isRead,
  ).length;

  const filteredAnnouncements = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return announcements.filter((announcement) => {
      const matchesSearch =
        !keyword ||
        announcement.title.toLowerCase().includes(keyword) ||
        announcement.content.toLowerCase().includes(keyword) ||
        getAuthorName(announcement).toLowerCase().includes(keyword);

      const matchesType =
        filterType === "all" || announcement.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [announcements, search, filterType]);

  const sortedAnnouncements = useMemo(() => {
    return [...filteredAnnouncements].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

      const aDate = new Date(a.publishedAt ?? a.createdAt).getTime();
      const bDate = new Date(b.publishedAt ?? b.createdAt).getTime();

      return bDate - aDate;
    });
  }, [filteredAnnouncements]);

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Announcements
              </h1>

              {unreadCount > 0 && (
                <span className="inline-flex bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Company updates, policy notices, and important employee
              information.
            </p>
          </div>

          {isHRAdmin && (
            <Button
              onClick={() => setShowCreate(true)}
              className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          )}
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
          label="Total"
          value={announcements.length}
          description="All announcements"
          icon={<Megaphone className="h-5 w-5" />}
        />

        <SummaryItem
          label="Unread"
          value={unreadCount}
          description="Need your attention"
          icon={<Bell className="h-5 w-5" />}
          tone={unreadCount > 0 ? "red" : "default"}
        />

        <SummaryItem
          label="Pinned"
          value={pinnedCount}
          description="Pinned to top"
          icon={<Pin className="h-5 w-5" />}
          tone="orange"
        />

        <SummaryItem
          label="Read"
          value={readCount}
          description="Already opened"
          icon={<CheckCircle className="h-5 w-5" />}
          tone="green"
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search announcements..."
              className="h-10 w-full border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              ...Object.entries(TYPE_CONFIG).map(([value, config]) => ({
                value,
                label: config.label,
              })),
            ].map((item) => {
              const active = filterType === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilterType(item.value)}
                  className={[
                    "h-9 px-3 text-xs font-semibold transition-colors",
                    active
                      ? "bg-[#0B5A43] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-4 py-16 text-sm text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0B5A43]" />
            Loading announcements...
          </div>
        ) : sortedAnnouncements.length === 0 ? (
          <div className="px-4 py-16">
            <EmptyState
              title={
                announcements.length === 0
                  ? "No announcements yet"
                  : "No matching announcements"
              }
              description={
                announcements.length === 0
                  ? "New company announcements will appear here."
                  : "Try changing the search keyword or filter."
              }
              action={
                isHRAdmin && announcements.length === 0 ? (
                  <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-[#0B5A43] text-white hover:bg-[#084735]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Announcement
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedAnnouncements.map((announcement) => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
                isHRAdmin={isHRAdmin}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <CreateAnnouncementModal
          onClose={() => setShowCreate(false)}
          onCreated={() => void fetchAnnouncements()}
        />
      )}
    </div>
  );
}
