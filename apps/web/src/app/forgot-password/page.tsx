"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!email.trim()) {
        setError("Please enter your email address.");
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${typeof window !== "undefined" && window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        console.error("Reset error:", resetError);
      }

      // Always show success message for security (don't reveal if email exists)
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      // Show generic success message for security
      setSuccess(true);
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-800/55 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          aria-label="Back to login"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image
              src="/images/light-logo.png"
              alt="SmartShield"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Reset Your Password</h1>
          <p className="mt-2 text-sm text-slate-300">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <p className="font-semibold mb-2">✓ Email Sent</p>
              <p>A password reset link has been sent to your email. Please check your inbox to reset your password.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-65"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-xs text-slate-400">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-[#8d93ff] hover:text-[#b2b6ff] font-semibold"
              >
                Sign in instead
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
