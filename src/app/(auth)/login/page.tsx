"use client";

// src/app/(auth)/login/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

function ArsadayaIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="200" height="200" rx="42" fill="#2D6A50" />
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
      <circle cx="100" cy="38" r="16" fill="#F5A623" />
    </svg>
  );
}

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: e } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (e) throw e;
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(
        err.message?.includes("Invalid login credentials")
          ? "Invalid email or password."
          : (err.message ?? "Something went wrong."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F5F7" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "#111B15" }}
      >
        <div className="flex items-center gap-2.5">
          <ArsadayaIcon size={32} />
          <span
            className="text-white font-bold tracking-widest text-base"
            style={{ fontFamily: "Georgia, serif" }}
          >
            ARSADAYA
          </span>
        </div>

        <div>
          <p className="text-2xl font-semibold text-white leading-snug mb-3">
            All your HR tools,
            <br />
            in one place.
          </p>
          <p className="text-sm" style={{ color: "#52A688" }}>
            Attendance · Leave · Payroll · Reports
          </p>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} ARSADAYA. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <ArsadayaIcon size={28} />
            <span
              className="font-bold tracking-widest text-sm"
              style={{ color: "#111B15", fontFamily: "Georgia, serif" }}
            >
              ARSADAYA
            </span>
          </div>

          <h1
            className="text-xl font-semibold mb-1"
            style={{ color: "#111827" }}
          >
            Sign in
          </h1>
          <p className="text-sm mb-7" style={{ color: "#6B7280" }}>
            Don't have an account?{" "}
            <Link
              href="/register"
              style={{ color: "#2D6A50" }}
              className="font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          {error && (
            <div
              className="mb-5 px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label
                htmlFor="email"
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "#374151" }}
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
                className="h-9 text-sm"
                style={{ borderColor: "#E5E7EB", background: "white" }}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium"
                  style={{ color: "#374151" }}
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs hover:underline"
                  style={{ color: "#2D6A50" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="h-9 text-sm pr-9"
                  style={{ borderColor: "#E5E7EB", background: "white" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#9CA3AF" }}
                >
                  {showPwd ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: "#2D6A50" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              or
            </span>
            <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full h-9 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            style={{
              border: "1px solid #E5E7EB",
              background: "white",
              color: "#374151",
            }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="hover:underline"
              style={{ color: "#6B7280" }}
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="hover:underline"
              style={{ color: "#6B7280" }}
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
