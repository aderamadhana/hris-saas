// src/components/employees/set-manager-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface Manager {
  id: string;
  name: string;
  position: string;
  role: string;
}

interface Props {
  employeeId: string;
  currentManagerId: string | null;
  managers: Manager[];
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

export function SetManagerForm({
  employeeId,
  currentManagerId,
  managers,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(currentManagerId ?? "none");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const hasChanged = selectedId !== (currentManagerId ?? "none");

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/employees/${employeeId}/set-manager`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: selectedId === "none" ? null : selectedId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update manager");
      setMessage({ text: "Manager updated successfully", ok: true });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, ok: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Assigning a manager enables the leave approval workflow for this
        employee.
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={selectedId}
          onValueChange={setSelectedId}
          disabled={isLoading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— No Manager —</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {m.position} · {ROLE_LABEL[m.role] ?? m.role}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanged || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
            message.ok
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.ok ? (
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
