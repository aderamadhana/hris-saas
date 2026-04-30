"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";

interface LeaveType {
  id: string;
  label: string;
  category: string;
  defaultDays: number | null;
  isPaidDefault: boolean;
  requiresDocDefault: boolean;
  description: string;
}

interface LeavePolicy {
  leaveTypeId: string;
  isEnabled: boolean;
  customName: string;
  maxDaysOverride: string;
  isPaidOverride: boolean | null;
  requiresApproval: boolean;
  requiresDocument: boolean;
  canCarryForward: boolean;
  maxCarryForward: string;
  countWeekend: boolean;
  requiresDelegation: boolean;
  notes: string;
}

type ApiLeavePolicy = Partial<
  Omit<LeavePolicy, "maxDaysOverride" | "maxCarryForward">
> & {
  leaveTypeId?: string;
  maxDaysOverride?: number | string | null;
  maxCarryForward?: number | string | null;
};

const ALL_LEAVE_TYPES: LeaveType[] = [
  {
    id: "annual",
    label: "Annual Leave",
    category: "Annual Leave",
    defaultDays: 12,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Standard yearly leave entitlement for employees.",
  },
  {
    id: "sick",
    label: "Sick Leave",
    category: "Health Leave",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: true,
    description:
      "Leave for medical reasons, usually supported by a doctor note.",
  },
  {
    id: "maternity",
    label: "Maternity Leave",
    category: "Parental Leave",
    defaultDays: 90,
    isPaidDefault: true,
    requiresDocDefault: true,
    description: "Leave for employees giving birth.",
  },
  {
    id: "paternity",
    label: "Paternity Leave",
    category: "Parental Leave",
    defaultDays: 2,
    isPaidDefault: true,
    requiresDocDefault: true,
    description: "Leave for employees whose spouse gives birth or miscarries.",
  },
  {
    id: "miscarriage",
    label: "Miscarriage Leave",
    category: "Parental Leave",
    defaultDays: 45,
    isPaidDefault: true,
    requiresDocDefault: true,
    description: "Leave for employees experiencing miscarriage.",
  },
  {
    id: "marriage",
    label: "Marriage Leave",
    category: "Special Leave",
    defaultDays: 3,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Leave for an employee's own marriage.",
  },
  {
    id: "child_marriage",
    label: "Child Marriage Leave",
    category: "Special Leave",
    defaultDays: 2,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Leave when an employee's child gets married.",
  },
  {
    id: "child_circumcision",
    label: "Child Circumcision Leave",
    category: "Special Leave",
    defaultDays: 2,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Leave when an employee's child has a circumcision ceremony.",
  },
  {
    id: "child_baptism",
    label: "Child Baptism Leave",
    category: "Special Leave",
    defaultDays: 2,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Leave when an employee's child has a baptism ceremony.",
  },
  {
    id: "death_family_home",
    label: "Bereavement Leave — Same Household",
    category: "Special Leave",
    defaultDays: 2,
    isPaidDefault: true,
    requiresDocDefault: false,
    description:
      "Leave for the death of a close family member living in the same household.",
  },
  {
    id: "death_family_away",
    label: "Bereavement Leave — Different Household",
    category: "Special Leave",
    defaultDays: 1,
    isPaidDefault: true,
    requiresDocDefault: false,
    description:
      "Leave for the death of a close family member living in a different household.",
  },
  {
    id: "hajj",
    label: "Hajj Leave",
    category: "Special Leave",
    defaultDays: 40,
    isPaidDefault: false,
    requiresDocDefault: true,
    description: "Leave for employees performing Hajj pilgrimage.",
  },
  {
    id: "replace_holiday",
    label: "Substitute Holiday Leave",
    category: "Special Leave",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: false,
    description:
      "Replacement leave when employees are required to work on a holiday.",
  },
  {
    id: "business_trip_city",
    label: "Out-of-Town Business Trip",
    category: "Work Arrangement",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Business travel outside the city within the same province.",
  },
  {
    id: "business_trip_province",
    label: "Out-of-Province Business Trip",
    category: "Work Arrangement",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Business travel outside the province or overseas.",
  },
  {
    id: "out_of_office",
    label: "Out of Office",
    category: "Work Arrangement",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: false,
    description:
      "Employees work outside the office for meetings or field work.",
  },
  {
    id: "wfh",
    label: "Work From Home",
    category: "Work Arrangement",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Employees work from home.",
  },
  {
    id: "wfa",
    label: "Work From Anywhere",
    category: "Work Arrangement",
    defaultDays: null,
    isPaidDefault: true,
    requiresDocDefault: false,
    description: "Employees work from a location other than office or home.",
  },
  {
    id: "unpaid",
    label: "Unpaid Leave",
    category: "Unpaid Leave",
    defaultDays: null,
    isPaidDefault: false,
    requiresDocDefault: false,
    description: "Leave agreed between company and employee without pay.",
  },
];

const LEAVE_CATEGORIES = Array.from(
  new Set(ALL_LEAVE_TYPES.map((type) => type.category)),
);

function createDefaultPolicy(type: LeaveType): LeavePolicy {
  return {
    leaveTypeId: type.id,
    isEnabled: false,
    customName: "",
    maxDaysOverride: "",
    isPaidOverride: null,
    requiresApproval: true,
    requiresDocument: type.requiresDocDefault,
    canCarryForward: false,
    maxCarryForward: "",
    countWeekend: ["sick", "maternity", "miscarriage", "hajj"].includes(
      type.id,
    ),
    requiresDelegation: [
      "annual",
      "sick",
      "maternity",
      "business_trip_city",
      "business_trip_province",
      "hajj",
    ].includes(type.id),
    notes: "",
  };
}

function createInitialPolicies() {
  const initial: Record<string, LeavePolicy> = {};

  ALL_LEAVE_TYPES.forEach((type) => {
    initial[type.id] = createDefaultPolicy(type);
  });

  return initial;
}

function toNullableInteger(value: string) {
  if (!value.trim()) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDefaultDays(days: number | null) {
  if (days === null) return "Unlimited";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function getEffectiveName(type: LeaveType, policy?: LeavePolicy) {
  return policy?.customName?.trim() || type.label;
}

function getEffectiveDays(type: LeaveType, policy?: LeavePolicy) {
  const override = policy?.maxDaysOverride?.trim();

  if (override) {
    const days = Number.parseInt(override, 10);

    if (Number.isFinite(days)) {
      return `${days} day${days === 1 ? "" : "s"}`;
    }
  }

  return formatDefaultDays(type.defaultDays);
}

function getEffectivePaidStatus(type: LeaveType, policy?: LeavePolicy) {
  return policy?.isPaidOverride ?? type.isPaidDefault;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-800">{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-gray-500">{hint}</p>}
    </div>
  );
}

function StatusPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "danger" | "muted";
}) {
  const toneClass = {
    default: "border-gray-300 bg-white text-gray-700",
    success: "border-green-200 bg-green-50 text-green-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    muted: "border-gray-200 bg-gray-50 text-gray-500",
  }[tone];

  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Saving
      </>
    );
  }

  if (saved) {
    return (
      <>
        <Save className="mr-2 h-4 w-4" />
        Saved
      </>
    );
  }

  return (
    <>
      <Save className="mr-2 h-4 w-4" />
      Save changes
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 border border-gray-200 bg-white p-3">
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
            {description}
          </span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function getPaidSelectValue(policy: LeavePolicy) {
  if (policy.isPaidOverride === null) return "default";
  return policy.isPaidOverride ? "paid" : "unpaid";
}

function toSafeString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function LeavePolicyPage() {
  const [policies, setPolicies] = useState<Record<string, LeavePolicy>>(
    createInitialPolicies,
  );

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPolicies() {
      try {
        const response = await fetch("/api/settings/leave-policy");

        if (!response.ok) {
          throw new Error("Failed to load leave policy settings.");
        }

        const data = await response.json();

        if (!mounted) return;

        if (Array.isArray(data.policies)) {
          setPolicies((previous) => {
            const updated = { ...previous };

            data.policies.forEach((policy: ApiLeavePolicy) => {
              if (!policy.leaveTypeId || !updated[policy.leaveTypeId]) return;

              updated[policy.leaveTypeId] = {
                ...updated[policy.leaveTypeId],
                ...policy,
                leaveTypeId: policy.leaveTypeId,
                maxDaysOverride: policy.maxDaysOverride?.toString() ?? "",
                maxCarryForward: policy.maxCarryForward?.toString() ?? "",
              };
            });

            return updated;
          });
        }
      } catch {
        if (mounted) {
          setError("Leave policy settings could not be loaded.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPolicies();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const values = Object.values(policies);
    const enabled = values.filter((policy) => policy.isEnabled);
    const paid = enabled.filter((policy) => {
      const type = ALL_LEAVE_TYPES.find(
        (item) => item.id === policy.leaveTypeId,
      );
      if (!type) return false;

      return getEffectivePaidStatus(type, policy);
    });

    return {
      enabledCount: enabled.length,
      totalCount: ALL_LEAVE_TYPES.length,
      paidCount: paid.length,
      documentCount: enabled.filter((policy) => policy.requiresDocument).length,
      carryForwardCount: enabled.filter((policy) => policy.canCarryForward)
        .length,
    };
  }, [policies]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return LEAVE_CATEGORIES.map((category) => {
      const types = ALL_LEAVE_TYPES.filter((type) => {
        if (type.category !== category) return false;
        if (!query) return true;

        return [
          type.label,
          type.category,
          type.description,
          policies[type.id]?.customName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

      return { category, types };
    }).filter((group) => group.types.length > 0);
  }, [policies, searchQuery]);

  const updatePolicy = <K extends keyof LeavePolicy>(
    typeId: string,
    field: K,
    value: LeavePolicy[K],
  ) => {
    const type = ALL_LEAVE_TYPES.find((item) => item.id === typeId);
    if (!type) return;

    setPolicies((previous) => ({
      ...previous,
      [typeId]: {
        ...(previous[typeId] ?? createDefaultPolicy(type)),
        [field]: value,
      },
    }));

    setSaved(false);
    setError(null);
  };

  const togglePolicyEnabled = (typeId: string, enabled: boolean) => {
    updatePolicy(typeId, "isEnabled", enabled);

    if (enabled) {
      setExpandedTypes((previous) => ({ ...previous, [typeId]: true }));
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories((previous) => ({
      ...previous,
      [category]: !(previous[category] ?? true),
    }));
  };

  const toggleDetails = (typeId: string) => {
    setExpandedTypes((previous) => ({
      ...previous,
      [typeId]: !previous[typeId],
    }));
  };

  const resetPolicyRules = (type: LeaveType) => {
    setPolicies((previous) => ({
      ...previous,
      [type.id]: {
        ...createDefaultPolicy(type),
        isEnabled: true,
      },
    }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const payload = Object.values(policies).map((policy) => ({
        ...policy,
        maxDaysOverride: toNullableInteger(policy.maxDaysOverride),
        maxCarryForward: toNullableInteger(policy.maxCarryForward),
      }));

      const response = await fetch("/api/settings/leave-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies: payload }),
      });

      if (!response.ok) {
        throw new Error("Failed to save leave policy settings.");
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Changes could not be saved. Check the API or try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        Loading leave policy settings...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Leave Policy Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Choose which leave and work request types employees can use.
              Configure entitlement, approval, documents, carry-forward, and HR
              notes in one place.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <SaveButton saving={saving} saved={saved} />
          </Button>
        </div>

        {error && (
          <div className="mt-4 flex gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </header>

      <div className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Active types"
          value={`${summary.enabledCount}/${summary.totalCount}`}
        />
        <SummaryItem label="Paid types" value={`${summary.paidCount}`} />
        <SummaryItem
          label="Require document"
          value={`${summary.documentCount}`}
        />
        <SummaryItem
          label="Carry forward"
          value={`${summary.carryForwardCount}`}
        />
      </div>

      <Notice>
        Enable only the leave types that are actually used by your company. Keep
        policy names simple, avoid duplicate request types, and make sure
        entitlement rules are reviewed before payroll and attendance are
        processed.
      </Notice>

      <div className="border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search leave type, category, or description..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No leave type matches your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map(({ category, types }) => {
            const activeInCategory = types.filter(
              (type) => policies[type.id]?.isEnabled,
            ).length;

            const isOpen = searchQuery.trim()
              ? true
              : (openCategories[category] ?? true);

            return (
              <section
                key={category}
                className="border border-gray-200 bg-white"
              >
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 border-b border-gray-200 p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                        )}

                        <div className="min-w-0">
                          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                            {category}
                          </h2>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {types.length} type{types.length === 1 ? "" : "s"}{" "}
                            shown
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-gray-600">
                        {activeInCategory} active
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="divide-y divide-gray-200">
                      {types.map((type) => {
                        const policy =
                          policies[type.id] ?? createDefaultPolicy(type);
                        const isEnabled = policy.isEnabled;
                        const isExpanded = expandedTypes[type.id] ?? isEnabled;
                        const effectivePaid = getEffectivePaidStatus(
                          type,
                          policy,
                        );

                        return (
                          <div key={type.id} className="bg-white">
                            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-950">
                                    {getEffectiveName(type, policy)}
                                  </h3>

                                  <StatusPill
                                    tone={isEnabled ? "success" : "muted"}
                                  >
                                    {isEnabled ? "Enabled" : "Disabled"}
                                  </StatusPill>

                                  <StatusPill>
                                    {getEffectiveDays(type, policy)}
                                  </StatusPill>

                                  <StatusPill
                                    tone={effectivePaid ? "success" : "danger"}
                                  >
                                    {effectivePaid ? "Paid" : "Unpaid"}
                                  </StatusPill>

                                  {policy.requiresDocument && (
                                    <StatusPill>Document required</StatusPill>
                                  )}
                                </div>

                                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                  {type.description}
                                </p>

                                {toSafeString(policy.customName).trim() && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    Default name: {type.label}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center justify-between gap-3 lg:justify-end">
                                {isEnabled && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleDetails(type.id)}
                                  >
                                    {isExpanded ? "Hide details" : "Edit rules"}
                                  </Button>
                                )}

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {isEnabled ? "On" : "Off"}
                                  </span>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) =>
                                      togglePolicyEnabled(type.id, checked)
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            {isEnabled && isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4">
                                <div className="grid gap-4 lg:grid-cols-2">
                                  <Field
                                    label="Display name"
                                    hint="Leave empty to use the default system name."
                                  >
                                    <Input
                                      value={policy.customName}
                                      placeholder={type.label}
                                      onChange={(event) =>
                                        updatePolicy(
                                          type.id,
                                          "customName",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </Field>

                                  <Field
                                    label="Maximum entitlement"
                                    hint="Leave empty to keep the default entitlement."
                                  >
                                    <Input
                                      type="number"
                                      min={0}
                                      value={policy.maxDaysOverride}
                                      placeholder={formatDefaultDays(
                                        type.defaultDays,
                                      )}
                                      onChange={(event) =>
                                        updatePolicy(
                                          type.id,
                                          "maxDaysOverride",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </Field>

                                  <Field
                                    label="Paid status"
                                    hint="Use default unless your company policy overrides it."
                                  >
                                    <Select
                                      value={getPaidSelectValue(policy)}
                                      onValueChange={(value) => {
                                        if (value === "default") {
                                          updatePolicy(
                                            type.id,
                                            "isPaidOverride",
                                            null,
                                          );
                                          return;
                                        }

                                        updatePolicy(
                                          type.id,
                                          "isPaidOverride",
                                          value === "paid",
                                        );
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="default">
                                          Use default —{" "}
                                          {type.isPaidDefault
                                            ? "Paid"
                                            : "Unpaid"}
                                        </SelectItem>
                                        <SelectItem value="paid">
                                          Paid
                                        </SelectItem>
                                        <SelectItem value="unpaid">
                                          Unpaid
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </Field>

                                  {policy.canCarryForward && (
                                    <Field
                                      label="Maximum carry-forward days"
                                      hint="Leave empty if there is no specific limit."
                                    >
                                      <Input
                                        type="number"
                                        min={0}
                                        value={policy.maxCarryForward}
                                        placeholder="Unlimited"
                                        onChange={(event) =>
                                          updatePolicy(
                                            type.id,
                                            "maxCarryForward",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </Field>
                                  )}
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  <SwitchRow
                                    label="Requires approval"
                                    description="Employees must wait for manager or HR approval."
                                    checked={policy.requiresApproval}
                                    onCheckedChange={(checked) =>
                                      updatePolicy(
                                        type.id,
                                        "requiresApproval",
                                        checked,
                                      )
                                    }
                                  />

                                  <SwitchRow
                                    label="Requires document"
                                    description="Employees must attach supporting evidence."
                                    checked={policy.requiresDocument}
                                    onCheckedChange={(checked) =>
                                      updatePolicy(
                                        type.id,
                                        "requiresDocument",
                                        checked,
                                      )
                                    }
                                  />

                                  <SwitchRow
                                    label="Count weekends"
                                    description="Saturday and Sunday are included in leave duration."
                                    checked={policy.countWeekend}
                                    onCheckedChange={(checked) =>
                                      updatePolicy(
                                        type.id,
                                        "countWeekend",
                                        checked,
                                      )
                                    }
                                  />

                                  <SwitchRow
                                    label="Requires handover"
                                    description="Employees must assign or explain task delegation."
                                    checked={policy.requiresDelegation}
                                    onCheckedChange={(checked) =>
                                      updatePolicy(
                                        type.id,
                                        "requiresDelegation",
                                        checked,
                                      )
                                    }
                                  />

                                  <SwitchRow
                                    label="Allow carry-forward"
                                    description="Remaining entitlement can move to the next period."
                                    checked={policy.canCarryForward}
                                    onCheckedChange={(checked) =>
                                      updatePolicy(
                                        type.id,
                                        "canCarryForward",
                                        checked,
                                      )
                                    }
                                  />
                                </div>

                                <div className="mt-4">
                                  <Field
                                    label="Internal HR notes"
                                    hint="Visible for administrators only. Use this for special rules or audit notes."
                                  >
                                    <Textarea
                                      value={policy.notes}
                                      rows={3}
                                      placeholder="Add internal notes or special conditions..."
                                      className="resize-none"
                                      onChange={(event) =>
                                        updatePolicy(
                                          type.id,
                                          "notes",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </Field>
                                </div>

                                <div className="mt-4 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resetPolicyRules(type)}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset rules
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </section>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 z-10 border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Save changes before employees submit new leave requests.
          </p>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <SaveButton saving={saving} saved={saved} />
          </Button>
        </div>
      </div>
    </div>
  );
}
