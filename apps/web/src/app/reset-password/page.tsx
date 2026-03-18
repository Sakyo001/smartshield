"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Verify the reset token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check if we have a valid session from the email link
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          setError("Invalid or expired reset link. Please request a new password reset.");
          setVerifying(false);
          return;
        }

        setVerifying(false);
      } catch (err) {
        console.error("Token verification error:", err);
        setError("Something went wrong. Please request a new password reset.");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please try again.");
        setLoading(false);
        return;
      }

      // Validate password length
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        setLoading(false);
        return;
      }

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password failed:", err);
      setError("Something went wrong while resetting your password.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-black flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B73FF]"></div>
          <p className="mt-4 text-slate-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

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
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-6">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            {error.includes("Invalid or expired") && (
              <button
                onClick={() => router.push("/forgot-password")}
                className="mt-3 text-[#8d93ff] hover:text-[#b2b6ff] font-semibold underline text-xs"
              >
                Request a new reset link
              </button>
            )}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <p className="font-semibold mb-2">✓ Password Updated</p>
              <p>Your password has been successfully reset. Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a new password"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-65"
            >
              {loading ? "Updating Password..." : "Update Password"}
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
