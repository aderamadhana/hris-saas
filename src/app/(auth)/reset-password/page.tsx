"use client";

// src/app/(auth)/reset-password/page.tsx

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

function ArsadayaIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="200" height="200" fill="#0B5A43" />
      <line
        x1="100"
        y1="52"
        x2="44"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="52"
        x2="156"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="65"
        y1="122"
        x2="135"
        y2="122"
        stroke="white"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <circle cx="100" cy="38" r="16" fill="#F7A81B" />
    </svg>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-sm font-medium text-white">{label}</p>
    </div>
  );
}

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

function getResetErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to reset password. Please try again.";
  }

  if (error.message.includes("New password should be different")) {
    return "Your new password must be different from your previous password.";
  }

  if (error.message.includes("Password should be at least")) {
    return "Password does not meet the minimum security requirement.";
  }

  return error.message || "Unable to reset password. Please try again.";
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [invalidLink, setInvalidLink] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resetComplete, setResetComplete] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [errors, setErrors] = React.useState({
    password: "",
    confirmPassword: "",
    submit: "",
  });

  const passwordChecks = getPasswordChecks(password);

  React.useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setInvalidLink(true);
      }

      setIsCheckingSession(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const validate = () => {
    const nextErrors = {
      password: "",
      confirmPassword: "",
      submit: "",
    };

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (!passwordChecks.minLength) {
      nextErrors.password = "Password must be at least 8 characters.";
    } else if (
      !passwordChecks.uppercase ||
      !passwordChecks.lowercase ||
      !passwordChecks.number
    ) {
      nextErrors.password =
        "Password must contain uppercase, lowercase, and number.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    return !nextErrors.password && !nextErrors.confirmPassword;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({
      password: "",
      confirmPassword: "",
      submit: "",
    });

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      setResetComplete(true);

      window.setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit: getResetErrorMessage(error),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-[#F8FBF8]">
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white p-7 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0B5A43]" />

            <h1 className="mt-5 text-xl font-semibold text-gray-950">
              Checking reset link
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Please wait while we verify your password reset session.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (invalidLink) {
    return (
      <main className="min-h-screen bg-[#F8FBF8]">
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-9 w-9" />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
              Invalid link
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
              Reset link expired
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              This password reset link is invalid or has expired. Request a new
              reset link to continue.
            </p>

            <Link
              href="/forgot-password"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735]"
            >
              Request new link
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="mt-4 inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (resetComplete) {
    return (
      <main className="min-h-screen bg-[#F8FBF8]">
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF5F0] text-[#0B5A43]">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#0B5A43]">
              Password updated
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
              Your password has been reset
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              You can now sign in using your new password.
            </p>

            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                Redirecting to login page...
              </p>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735]"
            >
              Go to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FBF8]">
      <div className="grid min-h-screen lg:grid-cols-[520px_1fr]">
        <section className="relative hidden overflow-hidden bg-[#0B5A43] text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F7A81B]/25" />
          <div className="pointer-events-none absolute bottom-24 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-black/10" />

          <div className="relative p-10">
            <div className="flex items-center gap-3">
              <ArsadayaIcon size={42} />
              <div>
                <p className="text-base font-bold tracking-[0.28em]">
                  ARSADAYA
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  HR management system
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-10">
            <p className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Create a stronger password for secure access.
            </p>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Use a password that is unique, hard to guess, and different from
              your previous password.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <FeatureItem label="Secure access" />
              <FeatureItem label="Protected account" />
              <FeatureItem label="Encrypted login" />
              <FeatureItem label="Fast recovery" />
            </div>
          </div>

          <div className="relative p-10 text-xs text-white/45">
            © {new Date().getFullYear()} ARSADAYA. All rights reserved.
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-6">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <ArsadayaIcon size={38} />
              <div>
                <p className="text-sm font-bold tracking-[0.25em] text-[#0B5A43]">
                  ARSADAYA
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  HR management system
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B5A43]">
                  Reset password
                </p>

                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
                  Set a new password
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Enter a new password for your account. You will be asked to
                  sign in again after the password is updated.
                </p>
              </div>

              {errors.submit && (
                <div className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{errors.submit}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
                noValidate
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-800"
                  >
                    New password
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-invalid={Boolean(errors.password)}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (errors.password || errors.submit) {
                          setErrors((current) => ({
                            ...current,
                            password: "",
                            submit: "",
                          }));
                        }
                      }}
                      className="h-11 pl-9 pr-10 text-sm focus-visible:ring-[#0B5A43]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0B5A43] disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="grid gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                  <PasswordCheck
                    valid={passwordChecks.minLength}
                    label="At least 8 characters"
                  />
                  <PasswordCheck
                    valid={passwordChecks.uppercase}
                    label="One uppercase letter"
                  />
                  <PasswordCheck
                    valid={passwordChecks.lowercase}
                    label="One lowercase letter"
                  />
                  <PasswordCheck
                    valid={passwordChecks.number}
                    label="One number"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-800"
                  >
                    Confirm new password
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (errors.confirmPassword || errors.submit) {
                          setErrors((current) => ({
                            ...current,
                            confirmPassword: "",
                            submit: "",
                          }));
                        }
                      }}
                      className="h-11 pl-9 pr-10 text-sm focus-visible:ring-[#0B5A43]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      disabled={isLoading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0B5A43] disabled:opacity-50"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password
                    </>
                  ) : (
                    <>
                      Update password
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
              For your security, use a password that you do not use on other
              websites.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordCheck({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-[#0B5A43]" />
      ) : (
        <ShieldCheck className="h-4 w-4 text-gray-300" />
      )}
      <span className={valid ? "font-medium text-[#0B5A43]" : "text-gray-500"}>
        {label}
      </span>
    </div>
  );
}
