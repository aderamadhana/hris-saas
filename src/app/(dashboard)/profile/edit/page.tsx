// src/app/(dashboard)/profile/edit/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { ProfileForm } from "@/src/components/profile/profile-form";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      baseSalary: true,
      position: true,
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!employee) {
    redirect("/dashboard");
  }

  const employeeData = {
    id: employee.id,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    email: employee.email,
    phoneNumber: employee.phoneNumber ?? "",
    baseSalary: employee.baseSalary.toNumber(),
  };

  const fullName = `${employee.firstName ?? ""} ${
    employee.lastName ?? ""
  }`.trim();

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  Edit profile
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Update your personal information.
                </p>
              </div>
            </div>

            <div className="mt-4 border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-950">
                {fullName || "Unnamed employee"}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {employee.position || "No position assigned"}
                {employee.department?.name
                  ? ` · ${employee.department.name}`
                  : ""}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{employee.email}</p>
            </div>
          </div>

          <Link href="/profile">
            <Button
              variant="outline"
              className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to profile
            </Button>
          </Link>
        </div>
      </header>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Personal information
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Keep your name, email, phone number, and salary information
            accurate.
          </p>
        </div>

        <div className="p-5">
          <ProfileForm employee={employeeData} />
        </div>
      </section>
    </div>
  );
}
