"use client";

// src/app/(dashboard)/dashboard/documents/page.tsx

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface EmployeeDocument {
  id: string;
  employeeId: string;
  category: string;
  name: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isPrivate: boolean;
  isVerified: boolean;
  expiresAt?: string | null;
  createdAt: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  uploader: {
    firstName: string;
    lastName: string;
  };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

type DocumentsPayload =
  | EmployeeDocument[]
  | {
      success?: boolean;
      data?: EmployeeDocument[];
      documents?: EmployeeDocument[];
      error?: string;
    };

type EmployeesPayload =
  | EmployeeOption[]
  | {
      success?: boolean;
      data?: EmployeeOption[];
      employees?: EmployeeOption[];
      error?: string;
    };

const CATEGORIES = [
  {
    value: "contract",
    label: "Employment Contract",
    badgeClass: "bg-blue-50 text-blue-700",
  },
  {
    value: "id_card",
    label: "Identity Document",
    badgeClass: "bg-purple-50 text-purple-700",
  },
  {
    value: "certificate",
    label: "Certificate",
    badgeClass: "bg-[#EAF5F0] text-[#0B5A43]",
  },
  {
    value: "diploma",
    label: "Diploma",
    badgeClass: "bg-yellow-50 text-yellow-700",
  },
  {
    value: "photo",
    label: "Photo",
    badgeClass: "bg-pink-50 text-pink-700",
  },
  {
    value: "bpjs",
    label: "BPJS",
    badgeClass: "bg-teal-50 text-teal-700",
  },
  {
    value: "tax",
    label: "Tax Document",
    badgeClass: "bg-orange-50 text-orange-700",
  },
  {
    value: "medical",
    label: "Medical Document",
    badgeClass: "bg-red-50 text-red-700",
  },
  {
    value: "other",
    label: "Other",
    badgeClass: "bg-gray-100 text-gray-700",
  },
];

const FILE_ICONS: Record<string, ElementType> = {
  pdf: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  webp: Image,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  doc: FileText,
  docx: FileText,
};

function getCategoryConfig(value: string) {
  return (
    CATEGORIES.find((category) => category.value === value) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

function getFileIcon(fileType: string) {
  return FILE_ICONS[fileType.toLowerCase()] ?? File;
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
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

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

function isExpiringSoon(expiresAt?: string | null) {
  if (!expiresAt) return false;

  const expiryTime = new Date(expiresAt).getTime();

  if (Number.isNaN(expiryTime)) return false;

  const diff = expiryTime - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

function extractDocuments(payload: DocumentsPayload | null) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;

  if (Array.isArray(payload.documents)) return payload.documents;

  return [];
}

function extractEmployees(payload: EmployeesPayload | null) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;

  if (Array.isArray(payload.employees)) return payload.employees;

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
        <FolderOpen className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

function UploadModal({
  employees,
  currentEmployeeId,
  isHRAdmin,
  onClose,
  onUploaded,
}: {
  employees: EmployeeOption[];
  currentEmployeeId: string;
  isHRAdmin: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [form, setForm] = useState({
    employeeId: currentEmployeeId,
    category: "other",
    name: "",
    description: "",
    fileUrl: "",
    fileType: "pdf",
    fileSize: "",
    isPrivate: false,
    expiresAt: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!form.employeeId && currentEmployeeId) {
      setForm((current) => ({
        ...current,
        employeeId: currentEmployeeId,
      }));
    }
  }, [currentEmployeeId, form.employeeId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.employeeId) {
      setError("Employee is required.");
      return;
    }

    if (!form.name.trim() || !form.fileUrl.trim()) {
      setError("Document name and file URL are required.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: form.employeeId,
          category: form.category,
          name: form.name.trim(),
          description: form.description.trim() || null,
          fileUrl: form.fileUrl.trim(),
          fileType: form.fileType.trim().toLowerCase(),
          fileSize: Number.parseInt(form.fileSize, 10) || 0,
          isPrivate: Boolean(form.isPrivate),
          expiresAt: form.expiresAt || null,
        }),
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(getPayloadError(payload, "Failed to save document."));
      }

      onUploaded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell>
      <div className="w-full max-w-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#EAF5F0] text-[#0B5A43]">
              <Upload className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-950">
                Upload Document
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add a document record for an employee.
              </p>
            </div>
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

          {isHRAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Employee
              </label>
              <select
                required
                value={form.employeeId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    employeeId: event.target.value,
                  }))
                }
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                <option value="" disabled>
                  Select employee
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} (
                    {employee.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Document Name
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
              placeholder="Example: Employment Contract - Olivia Owen"
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              File URL
            </label>
            <input
              required
              value={form.fileUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fileUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
            />
            <p className="mt-1 text-xs text-gray-400">
              Upload the file to storage first, then paste the public or signed
              URL here.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                File Type
              </label>
              <select
                value={form.fileType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fileType: event.target.value,
                  }))
                }
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                {[
                  "pdf",
                  "jpg",
                  "jpeg",
                  "png",
                  "webp",
                  "doc",
                  "docx",
                  "xls",
                  "xlsx",
                ].map((type) => (
                  <option key={type} value={type}>
                    .{type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                File Size in Bytes
              </label>
              <input
                type="number"
                min="0"
                value={form.fileSize}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fileSize: event.target.value,
                  }))
                }
                placeholder="0"
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
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
              placeholder="Optional notes about this document."
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          {isHRAdmin && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isPrivate: event.target.checked,
                  }))
                }
              />
              Private document. Only HR, admin, and owner can access it.
            </label>
          )}

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
                "Save Document"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

function DocumentItem({
  document,
  onDelete,
}: {
  document: EmployeeDocument;
  onDelete: (id: string) => void;
}) {
  const category = getCategoryConfig(document.category);
  const FileIcon = getFileIcon(document.fileType);
  const expired = isExpired(document.expiresAt);
  const expiringSoon = isExpiringSoon(document.expiresAt);

  const employeeName =
    `${document.employee.firstName} ${document.employee.lastName}`.trim();
  const uploaderName =
    `${document.uploader.firstName} ${document.uploader.lastName}`.trim();

  return (
    <article
      className={[
        "border border-gray-200 bg-white p-4",
        expired
          ? "border-l-4 border-l-red-500"
          : expiringSoon
            ? "border-l-4 border-l-[#F7A81B]"
            : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center",
              expired
                ? "bg-red-50 text-red-600"
                : expiringSoon
                  ? "bg-[#FFF4D9] text-[#7A5A00]"
                  : "bg-[#EAF5F0] text-[#0B5A43]",
            ].join(" ")}
          >
            <FileIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-950">
                {document.name}
              </h3>

              {document.isPrivate && (
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                  <Shield className="h-3 w-3" />
                  Private
                </span>
              )}

              {document.isVerified && (
                <span className="inline-flex items-center gap-1 bg-[#EAF5F0] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0B5A43]">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {employeeName} · {document.employee.employeeId}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold ${category.badgeClass}`}
              >
                {category.label}
              </span>
              <span className="text-xs text-gray-400">
                {formatFileSize(document.fileSize)}
              </span>
              <span className="text-xs uppercase text-gray-400">
                .{document.fileType}
              </span>
            </div>

            {document.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                {document.description}
              </p>
            )}

            {document.expiresAt && (
              <div
                className={[
                  "mt-2 flex items-center gap-1.5 text-xs",
                  expired
                    ? "text-red-600"
                    : expiringSoon
                      ? "text-[#7A5A00]"
                      : "text-gray-500",
                ].join(" ")}
              >
                {(expired || expiringSoon) && (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <Clock className="h-3.5 w-3.5" />
                {expired
                  ? `Expired on ${formatDate(document.expiresAt)}`
                  : expiringSoon
                    ? `Expiring soon on ${formatDate(document.expiresAt)}`
                    : `Valid until ${formatDate(document.expiresAt)}`}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-400">
              Uploaded by {uploaderName || "Unknown"} ·{" "}
              {formatDate(document.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:border-[#0B5A43] hover:text-[#0B5A43]"
          >
            <Eye className="h-4 w-4" />
            View
          </a>

          <a
            href={document.fileUrl}
            download
            className="inline-flex h-9 items-center gap-2 bg-[#EAF5F0] px-3 text-sm font-semibold text-[#0B5A43] hover:bg-[#DCEFE7]"
          >
            <Download className="h-4 w-4" />
            Download
          </a>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Delete this document? This action cannot be undone.",
                )
              ) {
                onDelete(document.id);
              }
            }}
            className="inline-flex h-9 items-center justify-center border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50"
            aria-label="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [isHRAdmin, setIsHRAdmin] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/documents", {
        cache: "no-store",
      });

      const payload = await readJson<DocumentsPayload>(response);

      if (!response.ok) {
        throw new Error(getPayloadError(payload, "Failed to load documents."));
      }

      setDocuments(extractDocuments(payload));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load documents.",
      );
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees", {
        cache: "no-store",
      });

      const payload = await readJson<EmployeesPayload>(response);

      if (response.ok) {
        setEmployees(extractEmployees(payload));
      }
    } catch {
      setEmployees([]);
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
          id?: string;
          role?: string;
        };
      }>(response);

      const employeeId = payload?.data?.id ?? "";
      const role = payload?.data?.role ?? "";

      setCurrentEmployeeId(employeeId);
      setIsHRAdmin(["owner", "admin", "hr"].includes(role));
    } catch {
      setCurrentEmployeeId("");
      setIsHRAdmin(false);
    }
  };

  useEffect(() => {
    void fetchDocuments();
    void fetchEmployees();
    void fetchProfile();
  }, []);

  const handleDelete = async (id: string) => {
    const previousDocuments = documents;

    setDocuments((current) => current.filter((document) => document.id !== id));

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      const payload = await readJson<{ success?: boolean; error?: string }>(
        response,
      );

      if (!response.ok || payload?.success === false) {
        throw new Error(getPayloadError(payload, "Failed to delete document."));
      }
    } catch (err: unknown) {
      setDocuments(previousDocuments);
      setError(
        err instanceof Error ? err.message : "Failed to delete document.",
      );
    }
  };

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return documents.filter((document) => {
      const employeeName =
        `${document.employee.firstName} ${document.employee.lastName}`.toLowerCase();

      const matchesSearch =
        !keyword ||
        document.name.toLowerCase().includes(keyword) ||
        employeeName.includes(keyword) ||
        document.employee.employeeId.toLowerCase().includes(keyword) ||
        document.description?.toLowerCase().includes(keyword);

      const matchesCategory =
        filterCategory === "all" || document.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [documents, search, filterCategory]);

  const verifiedCount = documents.filter(
    (document) => document.isVerified,
  ).length;

  const privateCount = documents.filter(
    (document) => document.isPrivate,
  ).length;

  const expiredCount = documents.filter((document) =>
    isExpired(document.expiresAt),
  ).length;

  const expiringSoonCount = documents.filter((document) =>
    isExpiringSoon(document.expiresAt),
  ).length;

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Documents
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage employee files, contracts, certificates, and personal
              documents.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowUpload(true)}
            className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
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
          label="Documents"
          value={documents.length}
          description="Total records"
          icon={<FolderOpen className="h-5 w-5" />}
        />

        <SummaryItem
          label="Verified"
          value={verifiedCount}
          description="Checked documents"
          icon={<CheckCircle className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Private"
          value={privateCount}
          description="Restricted access"
          icon={<Shield className="h-5 w-5" />}
          tone="orange"
        />

        <SummaryItem
          label="Expired"
          value={expiredCount + expiringSoonCount}
          description="Expired or expiring soon"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={expiredCount + expiringSoonCount > 0 ? "red" : "default"}
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents, employees, or employee ID..."
              className="h-10 w-full border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[#0B5A43]"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="h-10 border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-4 py-16 text-sm text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0B5A43]" />
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="px-4 py-16">
            <EmptyState
              title={
                documents.length === 0
                  ? "No documents yet"
                  : "No matching documents"
              }
              description={
                documents.length === 0
                  ? "Upload the first document to start organizing employee files."
                  : "Try changing the search keyword or category filter."
              }
              action={
                documents.length === 0 ? (
                  <Button
                    type="button"
                    onClick={() => setShowUpload(true)}
                    className="bg-[#0B5A43] text-white hover:bg-[#084735]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDocuments.map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {showUpload && (
        <UploadModal
          employees={employees}
          currentEmployeeId={currentEmployeeId}
          isHRAdmin={isHRAdmin}
          onClose={() => setShowUpload(false)}
          onUploaded={() => void fetchDocuments()}
        />
      )}
    </div>
  );
}
