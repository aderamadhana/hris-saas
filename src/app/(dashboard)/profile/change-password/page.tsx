// src/app/(dashboard)/profile/change-password/page.tsx

import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { PasswordForm } from "@/src/components/profile/password-form";
import { Button } from "@/src/components/ui/button";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                <KeyRound className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  Change password
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Update your account password.
                </p>
              </div>
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
            New password
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Enter your current password, then set and confirm your new password.
          </p>
        </div>

        <div className="p-5">
          <PasswordForm />
        </div>
      </section>

      <section className="border border-[#F7A81B]/40 bg-[#FFF4D9] p-4">
        <p className="text-sm font-semibold text-[#0B5A43]">
          Security reminder
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[#7A5A00]">
          Use a password that is unique, hard to guess, and not used on other
          websites.
        </p>
      </section>
    </div>
  );
}
