// src/components/employees/employee-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";

interface EmployeeData {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  position: string;
  department: string;
  role: string;
  status: string;
  joinDate: string;
  hasAuth: boolean;
  manager: string | null;
}

interface EmployeeTableProps {
  data: EmployeeData[];
  currentUserRole: string;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-700 border-gray-200",
  terminated: "bg-red-100 text-red-800 border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  terminated: "Terminated",
};

const ROLE_STYLE: Record<string, string> = {
  owner: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-orange-100 text-orange-800 border-orange-200",
  hr: "bg-purple-100 text-purple-800 border-purple-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200",
  employee: "bg-gray-100 text-gray-700 border-gray-200",
};
const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

function Badge({ text, style }: { text: string; style: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {text}
    </span>
  );
}

export function EmployeeTable({ data, currentUserRole }: EmployeeTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeData | null>(null);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  const canEdit = ["hr", "admin", "owner"].includes(currentUserRole);
  const canDelete = ["admin", "owner"].includes(currentUserRole);
  const canInvite = ["hr", "admin", "owner"].includes(currentUserRole);

  const filtered = data.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  });

  const handleInvite = async (emp: EmployeeData) => {
    if (!confirm(`Send invitation email to ${emp.email}?`)) return;
    setInviteLoading(emp.id);
    setInviteMsg(null);
    try {
      const res = await fetch(`/api/employees/${emp.id}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      setInviteMsg({ msg: `Invitation sent to ${emp.email}`, ok: true });
      router.refresh();
    } catch (err: any) {
      setInviteMsg({ msg: err.message, ok: false });
    } finally {
      setInviteLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, email, position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invite feedback */}
      {inviteMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            inviteMsg.ok
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {inviteMsg.ok ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{inviteMsg.msg}</span>
          <button
            onClick={() => setInviteMsg(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {[
                "ID",
                "Name",
                "Email",
                "Position",
                "Department",
                "Role",
                "Status",
                "Account",
                "",
              ].map((h, i) => (
                <TableHead
                  key={i}
                  className={`text-xs font-semibold uppercase tracking-wide ${i === 8 ? "w-[60px]" : ""}`}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-gray-400"
                >
                  {search
                    ? "No employees match your search"
                    : "No employees found"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-xs text-gray-500">
                    {emp.employeeId}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    {emp.manager && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Manager: {emp.manager}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {emp.email}
                  </TableCell>
                  <TableCell className="text-sm">{emp.position}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {emp.department}
                  </TableCell>
                  <TableCell>
                    <Badge
                      text={ROLE_LABEL[emp.role] ?? emp.role}
                      style={
                        ROLE_STYLE[emp.role] ?? "bg-gray-100 text-gray-700"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      text={STATUS_LABEL[emp.status] ?? emp.status}
                      style={
                        STATUS_STYLE[emp.status] ?? "bg-gray-100 text-gray-700"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {emp.hasAuth ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-gray-400">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/employees/${emp.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/employees/${emp.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {canInvite && !emp.hasAuth && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleInvite(emp)}
                              disabled={inviteLoading === emp.id}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              {inviteLoading === emp.id
                                ? "Sending..."
                                : "Send Invitation"}
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && emp.role !== "owner" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelected(emp);
                                setDeleteOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-400">
        Showing {filtered.length} of {data.length} employees
      </p>

      {selected && (
        <DeleteEmployeeDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          employee={selected}
        />
      )}
    </div>
  );
}
