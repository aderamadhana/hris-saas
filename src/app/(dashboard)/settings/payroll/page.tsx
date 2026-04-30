"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";

interface CustomComponent {
  id: string;
  name: string;
  type: "fixed" | "percent";
  amount: number;
  taxable: boolean;
}

interface PayrollConfigState {
  bpjsKesEnabled: boolean;
  bpjsKesEmployee: number;
  bpjsKesEmployer: number;
  bpjsKesMaxSalary: string;

  bpjsTkEnabled: boolean;
  bpjsTkJHT: number;
  bpjsTkJHTEmployer: number;
  bpjsTkJP: number;
  bpjsTkJPEmployer: number;
  bpjsTkJKK: number;
  bpjsTkJKM: number;
  bpjsTkMaxSalary: string;

  pph21Enabled: boolean;
  pph21Method: string;
  pph21PTKP: number;
  ptkpStatus: string;

  lateDeductEnabled: boolean;
  lateGraceMinutes: number;
  lateDeductMethod: string;
  lateDeductAmount: number;
  lateDeductPercent: number;

  earlyLeaveDeductEnabled: boolean;
  earlyLeaveDeductMethod: string;
  earlyLeaveDeductAmount: number;
  earlyLeaveDeductPercent: number;

  absentDeductEnabled: boolean;
  absentDeductMethod: string;
  absentDeductAmount: number;

  overtimeEnabled: boolean;
  overtimeRate1: number;
  overtimeRate2: number;
  overtimeHourlyBasis: number;

  payrollDate: number;
  cutoffDate: number;
  workingDaysPerMonth: number;

  customAllowances: CustomComponent[];
  customDeductions: CustomComponent[];
}

const DEFAULT_CONFIG: PayrollConfigState = {
  bpjsKesEnabled: false,
  bpjsKesEmployee: 1,
  bpjsKesEmployer: 4,
  bpjsKesMaxSalary: "",

  bpjsTkEnabled: false,
  bpjsTkJHT: 2,
  bpjsTkJHTEmployer: 3.7,
  bpjsTkJP: 1,
  bpjsTkJPEmployer: 2,
  bpjsTkJKK: 0.24,
  bpjsTkJKM: 0.3,
  bpjsTkMaxSalary: "",

  pph21Enabled: false,
  pph21Method: "gross",
  pph21PTKP: 54_000_000,
  ptkpStatus: "TK/0",

  lateDeductEnabled: false,
  lateGraceMinutes: 15,
  lateDeductMethod: "minute_salary",
  lateDeductAmount: 0,
  lateDeductPercent: 0,

  earlyLeaveDeductEnabled: false,
  earlyLeaveDeductMethod: "minute_salary",
  earlyLeaveDeductAmount: 0,
  earlyLeaveDeductPercent: 0,

  absentDeductEnabled: false,
  absentDeductMethod: "daily_salary",
  absentDeductAmount: 0,

  overtimeEnabled: true,
  overtimeRate1: 1.5,
  overtimeRate2: 2,
  overtimeHourlyBasis: 173,

  payrollDate: 25,
  cutoffDate: 20,
  workingDaysPerMonth: 22,

  customAllowances: [],
  customDeductions: [],
};

const PTKP_OPTIONS = [
  {
    value: "TK/0",
    label: "TK/0 — Single, no dependent",
    amount: 54_000_000,
  },
  {
    value: "TK/1",
    label: "TK/1 — Single, 1 dependent",
    amount: 58_500_000,
  },
  {
    value: "TK/2",
    label: "TK/2 — Single, 2 dependents",
    amount: 63_000_000,
  },
  {
    value: "TK/3",
    label: "TK/3 — Single, 3 dependents",
    amount: 67_500_000,
  },
  {
    value: "K/0",
    label: "K/0 — Married, no dependent",
    amount: 58_500_000,
  },
  {
    value: "K/1",
    label: "K/1 — Married, 1 dependent",
    amount: 63_000_000,
  },
  {
    value: "K/2",
    label: "K/2 — Married, 2 dependents",
    amount: 67_500_000,
  },
  {
    value: "K/3",
    label: "K/3 — Married, 3 dependents",
    amount: 72_000_000,
  },
];

const DEDUCTION_METHODS = [
  { value: "per_minute", label: "Fixed amount per minute" },
  { value: "per_hour", label: "Fixed amount per hour" },
  { value: "minute_salary", label: "Based on salary per minute" },
  { value: "salary_cut", label: "Percentage of daily salary" },
  { value: "fixed", label: "Fixed amount per occurrence" },
];

function toNumber(value: string, fallback = 0) {
  if (value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value: string, fallback = 0) {
  if (value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatRupiah(value?: number | string | null) {
  const numericValue = typeof value === "string" ? Number(value) : value;

  if (!numericValue || !Number.isFinite(numericValue)) {
    return "No limit";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function safeParseComponents(value: unknown): CustomComponent[] {
  if (Array.isArray(value)) return value as CustomComponent[];
  if (typeof value !== "string" || value.trim() === "") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getComponentId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

function StatusText({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={
        enabled
          ? "text-xs font-medium text-green-700"
          : "text-xs font-medium text-gray-500"
      }
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
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

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Section({
  title,
  description,
  enabled,
  onEnabledChange,
  disabledText = "Enable this setting to configure the details.",
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  disabledText?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-950">{title}</h2>
            <StatusText enabled={enabled} />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {enabled ? "On" : "Off"}
          </span>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </div>

      {enabled ? (
        <div className="space-y-4 p-4">{children}</div>
      ) : (
        <div className="p-4 text-sm text-gray-500">{disabledText}</div>
      )}
    </section>
  );
}

function PercentInput({
  value,
  onChange,
  step = "0.1",
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(event) => onChange(toNumber(event.target.value))}
        className="pr-10"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
        %
      </span>
    </div>
  );
}

function DeductionMethodSelect({
  label,
  value,
  onValueChange,
  hideFixed = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hideFixed?: boolean;
}) {
  const options = hideFixed
    ? DEDUCTION_METHODS.filter((method) => method.value !== "fixed")
    : DEDUCTION_METHODS;

  return (
    <Field label={label} hint="Choose the method that is easiest to audit.">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((method) => (
            <SelectItem key={method.value} value={method.value}>
              {method.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function renderDeductionAmountFields({
  method,
  amount,
  percent,
  setAmount,
  setPercent,
}: {
  method: string;
  amount: number;
  percent: number;
  setAmount: (value: number) => void;
  setPercent: (value: number) => void;
}) {
  if (["per_minute", "per_hour", "fixed"].includes(method)) {
    const label =
      method === "fixed"
        ? "Amount per occurrence"
        : method === "per_minute"
          ? "Amount per minute"
          : "Amount per hour";

    return (
      <Field
        label={label}
        hint="This amount will be multiplied by the occurrence or duration."
      >
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(toNumber(event.target.value))}
        />
      </Field>
    );
  }

  if (method === "salary_cut") {
    return (
      <Field
        label="Percentage of daily salary"
        hint="Example: 50 means 50% of the daily salary will be deducted."
      >
        <PercentInput value={percent} onChange={setPercent} step="0.1" />
      </Field>
    );
  }

  return (
    <div className="border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
      The deduction is calculated automatically from salary per minute.
    </div>
  );
}

function ComponentList({
  title,
  description,
  buttonLabel,
  emptyText,
  items,
  onAdd,
  onRemove,
  onUpdate,
  showTaxable = false,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  emptyText: string;
  items: CustomComponent[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: <K extends keyof CustomComponent>(
    id: string,
    field: K,
    value: CustomComponent[K],
  ) => void;
  showTaxable?: boolean;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </div>

      <div className="divide-y divide-gray-200">
        {items.length === 0 && (
          <div className="p-4 text-sm text-gray-500">{emptyText}</div>
        )}

        {items.map((item, index) => (
          <div key={item.id} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-700">
                Item {index + 1}
              </p>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onRemove(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
              <Field label="Component name">
                <Input
                  placeholder="Example: Transport allowance"
                  value={item.name}
                  onChange={(event) =>
                    onUpdate(item.id, "name", event.target.value)
                  }
                />
              </Field>

              <Field label="Amount">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={item.amount}
                  onChange={(event) =>
                    onUpdate(item.id, "amount", toNumber(event.target.value))
                  }
                />
              </Field>

              {showTaxable && (
                <label className="flex min-h-10 items-center gap-2 border border-gray-200 px-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={item.taxable}
                    onChange={(event) =>
                      onUpdate(item.id, "taxable", event.target.checked)
                    }
                  />
                  Taxable
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PayrollSettingsPage() {
  const [config, setConfig] = useState<PayrollConfigState>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      try {
        const response = await fetch("/api/settings/payroll");

        if (!response.ok) {
          throw new Error("Failed to load payroll settings.");
        }

        const data = await response.json();

        if (!mounted) return;

        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            customAllowances: safeParseComponents(data.config.customAllowances),
            customDeductions: safeParseComponents(data.config.customDeductions),
            bpjsKesMaxSalary: data.config.bpjsKesMaxSalary?.toString() ?? "",
            bpjsTkMaxSalary: data.config.bpjsTkMaxSalary?.toString() ?? "",
          }));
        }
      } catch {
        if (mounted) {
          setError("Payroll settings could not be loaded.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const activeBpjs = [config.bpjsKesEnabled, config.bpjsTkEnabled].filter(
      Boolean,
    ).length;

    const activeDeductions = [
      config.lateDeductEnabled,
      config.earlyLeaveDeductEnabled,
      config.absentDeductEnabled,
    ].filter(Boolean).length;

    return {
      activeBpjs,
      activeDeductions,
      fixedComponents:
        config.customAllowances.length + config.customDeductions.length,
    };
  }, [config]);

  const setField = <K extends keyof PayrollConfigState>(
    key: K,
    value: PayrollConfigState[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const addComponent = (type: "customAllowances" | "customDeductions") => {
    const newItem: CustomComponent = {
      id: getComponentId(),
      name: "",
      type: "fixed",
      amount: 0,
      taxable: false,
    };

    setField(type, [...config[type], newItem]);
  };

  const removeComponent = (
    type: "customAllowances" | "customDeductions",
    id: string,
  ) => {
    setField(
      type,
      config[type].filter((component) => component.id !== id),
    );
  };

  const updateComponent = <K extends keyof CustomComponent>(
    type: "customAllowances" | "customDeductions",
    id: string,
    field: K,
    value: CustomComponent[K],
  ) => {
    setField(
      type,
      config[type].map((component) =>
        component.id === id ? { ...component, [field]: value } : component,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const payload = {
        ...config,
        customAllowances: JSON.stringify(config.customAllowances),
        customDeductions: JSON.stringify(config.customDeductions),
        bpjsKesMaxSalary: config.bpjsKesMaxSalary
          ? Number(config.bpjsKesMaxSalary)
          : null,
        bpjsTkMaxSalary: config.bpjsTkMaxSalary
          ? Number(config.bpjsTkMaxSalary)
          : null,
      };

      const response = await fetch("/api/settings/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save payroll settings.");
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
        Loading payroll settings...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Payroll Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Configure payroll rules for BPJS, tax, deductions, overtime,
              payroll period, and fixed components.
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
        <SummaryItem label="BPJS" value={`${summary.activeBpjs}/2 active`} />
        <SummaryItem
          label="PPh21"
          value={config.pph21Enabled ? "Enabled" : "Disabled"}
        />
        <SummaryItem
          label="Deductions"
          value={`${summary.activeDeductions}/3 active`}
        />
        <SummaryItem
          label="Fixed components"
          value={`${summary.fixedComponents} item(s)`}
        />
      </div>

      <Tabs defaultValue="bpjs" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-0 border border-gray-200 bg-white p-0 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="bpjs" className="rounded-none border-r py-3">
            BPJS
          </TabsTrigger>
          <TabsTrigger value="tax" className="rounded-none border-r py-3">
            Tax
          </TabsTrigger>
          <TabsTrigger
            value="deductions"
            className="rounded-none border-r py-3"
          >
            Deductions
          </TabsTrigger>
          <TabsTrigger value="overtime" className="rounded-none border-r py-3">
            Overtime & Period
          </TabsTrigger>
          <TabsTrigger value="components" className="rounded-none py-3">
            Components
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bpjs" className="space-y-4">
          <Notice>
            BPJS contributions may have employee-paid and employer-paid
            portions. Only employee-paid portions reduce take-home pay.
          </Notice>

          <Section
            title="BPJS Health"
            description="Configure health insurance contribution percentages and salary cap."
            enabled={config.bpjsKesEnabled}
            onEnabledChange={(value) => setField("bpjsKesEnabled", value)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Employee contribution"
                hint="Percentage deducted from employee salary."
              >
                <PercentInput
                  value={config.bpjsKesEmployee}
                  onChange={(value) => setField("bpjsKesEmployee", value)}
                />
              </Field>

              <Field
                label="Employer contribution"
                hint="Company cost. This does not reduce employee salary."
              >
                <PercentInput
                  value={config.bpjsKesEmployer}
                  onChange={(value) => setField("bpjsKesEmployer", value)}
                />
              </Field>
            </div>

            <Field
              label="Salary cap"
              hint={`Current value: ${formatRupiah(
                config.bpjsKesMaxSalary,
              )}. Leave empty if no cap is used.`}
            >
              <Input
                type="number"
                min={0}
                placeholder="Example: 12000000"
                value={config.bpjsKesMaxSalary}
                onChange={(event) =>
                  setField("bpjsKesMaxSalary", event.target.value)
                }
              />
            </Field>
          </Section>

          <Section
            title="BPJS Employment"
            description="Configure JHT, JP, JKK, and JKM contribution rules."
            enabled={config.bpjsTkEnabled}
            onEnabledChange={(value) => setField("bpjsTkEnabled", value)}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="JHT employee">
                <PercentInput
                  value={config.bpjsTkJHT}
                  onChange={(value) => setField("bpjsTkJHT", value)}
                />
              </Field>

              <Field label="JHT employer">
                <PercentInput
                  value={config.bpjsTkJHTEmployer}
                  onChange={(value) => setField("bpjsTkJHTEmployer", value)}
                />
              </Field>

              <Field label="JP employee">
                <PercentInput
                  value={config.bpjsTkJP}
                  onChange={(value) => setField("bpjsTkJP", value)}
                />
              </Field>

              <Field label="JP employer">
                <PercentInput
                  value={config.bpjsTkJPEmployer}
                  onChange={(value) => setField("bpjsTkJPEmployer", value)}
                />
              </Field>

              <Field label="JKK employer">
                <PercentInput
                  value={config.bpjsTkJKK}
                  onChange={(value) => setField("bpjsTkJKK", value)}
                  step="0.01"
                />
              </Field>

              <Field label="JKM employer">
                <PercentInput
                  value={config.bpjsTkJKM}
                  onChange={(value) => setField("bpjsTkJKM", value)}
                  step="0.01"
                />
              </Field>
            </div>

            <Field
              label="Salary cap"
              hint={`Current value: ${formatRupiah(
                config.bpjsTkMaxSalary,
              )}. Leave empty if no cap is used.`}
            >
              <Input
                type="number"
                min={0}
                placeholder="Example: 10000000"
                value={config.bpjsTkMaxSalary}
                onChange={(event) =>
                  setField("bpjsTkMaxSalary", event.target.value)
                }
              />
            </Field>
          </Section>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Notice>
            Use the default PTKP status only as the initial company-wide value.
            Employee-specific tax status should ideally be handled in the
            employee master data.
          </Notice>

          <Section
            title="PPh21 Tax"
            description="Configure employee income tax calculation method and default PTKP status."
            enabled={config.pph21Enabled}
            onEnabledChange={(value) => setField("pph21Enabled", value)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Calculation method"
                hint="Gross means the tax is deducted from employee salary."
              >
                <Select
                  value={config.pph21Method}
                  onValueChange={(value) => setField("pph21Method", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gross">
                      Gross — tax deducted from salary
                    </SelectItem>
                    <SelectItem value="gross_up">
                      Gross up — tax allowance provided by company
                    </SelectItem>
                    <SelectItem value="nett">
                      Nett — employee receives net amount
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Default PTKP status"
                hint={`PTKP value: ${formatRupiah(config.pph21PTKP)} per year.`}
              >
                <Select
                  value={config.ptkpStatus}
                  onValueChange={(value) => {
                    const selected = PTKP_OPTIONS.find(
                      (option) => option.value === value,
                    );

                    setField("ptkpStatus", value);

                    if (selected) {
                      setField("pph21PTKP", selected.amount);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PTKP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
              Make sure the tax rules match the latest regulation and have been
              reviewed by finance or a tax consultant.
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Notice>
            Attendance deductions should be based on a written company policy.
            Otherwise, they can create payroll disputes.
          </Notice>

          <Section
            title="Late arrival deduction"
            description="Configure grace period and deduction method for late attendance."
            enabled={config.lateDeductEnabled}
            onEnabledChange={(value) => setField("lateDeductEnabled", value)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Grace period"
                hint="Late attendance below this limit will not be deducted."
              >
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    value={config.lateGraceMinutes}
                    onChange={(event) =>
                      setField(
                        "lateGraceMinutes",
                        toInteger(event.target.value),
                      )
                    }
                    className="pr-16"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
                    minutes
                  </span>
                </div>
              </Field>

              <DeductionMethodSelect
                label="Deduction method"
                value={config.lateDeductMethod}
                onValueChange={(value) => setField("lateDeductMethod", value)}
              />
            </div>

            {renderDeductionAmountFields({
              method: config.lateDeductMethod,
              amount: config.lateDeductAmount,
              percent: config.lateDeductPercent,
              setAmount: (value) => setField("lateDeductAmount", value),
              setPercent: (value) => setField("lateDeductPercent", value),
            })}
          </Section>

          <Section
            title="Early leave deduction"
            description="Configure deduction rules when employees leave before the scheduled end time."
            enabled={config.earlyLeaveDeductEnabled}
            onEnabledChange={(value) =>
              setField("earlyLeaveDeductEnabled", value)
            }
          >
            <DeductionMethodSelect
              label="Deduction method"
              value={config.earlyLeaveDeductMethod}
              onValueChange={(value) =>
                setField("earlyLeaveDeductMethod", value)
              }
              hideFixed
            />

            {renderDeductionAmountFields({
              method: config.earlyLeaveDeductMethod,
              amount: config.earlyLeaveDeductAmount,
              percent: config.earlyLeaveDeductPercent,
              setAmount: (value) => setField("earlyLeaveDeductAmount", value),
              setPercent: (value) => setField("earlyLeaveDeductPercent", value),
            })}
          </Section>

          <Section
            title="Unexcused absence deduction"
            description="Configure deduction rules for absence without valid explanation."
            enabled={config.absentDeductEnabled}
            onEnabledChange={(value) => setField("absentDeductEnabled", value)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Deduction method"
                hint="Daily salary is usually easier to audit than a fixed amount."
              >
                <Select
                  value={config.absentDeductMethod}
                  onValueChange={(value) =>
                    setField("absentDeductMethod", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_salary">Daily salary</SelectItem>
                    <SelectItem value="fixed">
                      Fixed amount per absent day
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {config.absentDeductMethod === "fixed" && (
                <Field
                  label="Amount per absent day"
                  hint="This fixed amount applies to all employees."
                >
                  <Input
                    type="number"
                    min={0}
                    value={config.absentDeductAmount}
                    onChange={(event) =>
                      setField(
                        "absentDeductAmount",
                        toNumber(event.target.value),
                      )
                    }
                  />
                </Field>
              )}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-4">
          <Section
            title="Overtime pay"
            description="Configure overtime multipliers and hourly wage divisor."
            enabled={config.overtimeEnabled}
            onEnabledChange={(value) => setField("overtimeEnabled", value)}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="First overtime hour"
                hint="Multiplier for the first overtime hour."
              >
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={config.overtimeRate1}
                  onChange={(event) =>
                    setField("overtimeRate1", toNumber(event.target.value))
                  }
                />
              </Field>

              <Field
                label="Next overtime hours"
                hint="Multiplier for the second hour and onward."
              >
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={config.overtimeRate2}
                  onChange={(event) =>
                    setField("overtimeRate2", toNumber(event.target.value))
                  }
                />
              </Field>

              <Field
                label="Hourly wage divisor"
                hint="Used to calculate hourly wage."
              >
                <Input
                  type="number"
                  min={1}
                  value={config.overtimeHourlyBasis}
                  onChange={(event) =>
                    setField(
                      "overtimeHourlyBasis",
                      toInteger(event.target.value, 1),
                    )
                  }
                />
              </Field>

              <Field
                label="Working days per month"
                hint="Used to calculate daily salary."
              >
                <Input
                  type="number"
                  min={1}
                  value={config.workingDaysPerMonth}
                  onChange={(event) =>
                    setField(
                      "workingDaysPerMonth",
                      toInteger(event.target.value, 1),
                    )
                  }
                />
              </Field>
            </div>
          </Section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-950">
                Payroll period
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Define salary payment date and attendance cutoff date.
              </p>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <Field label="Payroll date" hint="Monthly salary payment date.">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={config.payrollDate}
                  onChange={(event) =>
                    setField("payrollDate", toInteger(event.target.value, 1))
                  }
                />
              </Field>

              <Field
                label="Attendance cutoff date"
                hint="Attendance after this date is included in the next payroll period."
              >
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={config.cutoffDate}
                  onChange={(event) =>
                    setField("cutoffDate", toInteger(event.target.value, 1))
                  }
                />
              </Field>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <ComponentList
            title="Fixed allowances"
            description="Add company-wide allowances such as transport or meal allowance."
            buttonLabel="Add allowance"
            emptyText="No fixed allowance has been added."
            items={config.customAllowances}
            onAdd={() => addComponent("customAllowances")}
            onRemove={(id) => removeComponent("customAllowances", id)}
            onUpdate={(id, field, value) =>
              updateComponent("customAllowances", id, field, value)
            }
            showTaxable
          />

          <ComponentList
            title="Fixed deductions"
            description="Add recurring company-wide deductions."
            buttonLabel="Add deduction"
            emptyText="No fixed deduction has been added."
            items={config.customDeductions}
            onAdd={() => addComponent("customDeductions")}
            onRemove={(id) => removeComponent("customDeductions", id)}
            onUpdate={(id, field, value) =>
              updateComponent("customDeductions", id, field, value)
            }
          />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-10 border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Save changes before running the next payroll calculation.
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
