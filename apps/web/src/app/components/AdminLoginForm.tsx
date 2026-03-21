// src/app/components/AdminLoginForm.tsx
"use client";

import { createClient } from "@lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try Supabase auth first
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: normalizedEmail,
          password,
        },
      );

      if (authError) {
        const message = (authError.message || "").toLowerCase();
        if (message.includes("email not confirmed")) {
          setError("Email is not confirmed. Confirm it in Supabase Auth and try again.");
        } else if (message.includes("invalid login credentials")) {
          setError("Invalid email or password.");
        } else {
          setError(authError.message || "Unable to sign in right now.");
        }
        console.error("Admin login auth error:", authError);
        return;
      }

      if (data.user) {
        // Check if user exists in admin_users table
        const { data: adminUser, error: adminError } = await supabase
          .from("admin_users")
          .select("email, display_name")
          .eq("email", data.user.email)
          .maybeSingle();

        if (adminError || !adminUser) {
          // User authenticated but not an admin
          await supabase.auth.signOut();
          setError("You do not have admin access");
          return;
        }

        // User is authenticated and is an admin
        router.replace("/admin/dashboard");
        router.refresh();
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center px-3 sm:px-6 py-6 sm:py-14">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-card {
          animation: fadeIn 0.6s ease-out;
        }

        .form-input {
          transition: all 0.3s ease;
        }

        .form-input:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(107, 115, 255, 0.2);
        }

        .login-button {
          transition: all 0.3s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(107, 115, 255, 0.3);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .password-toggle {
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #545BFF;
        }
      `}</style>

      <div className="admin-card w-full max-w-xs sm:max-w-sm md:max-w-md my-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <span className="text-gray-100 text-lg sm:text-2xl font-bold">
              SmartShield
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-1 sm:mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-panel backdrop-blur-xl border border-[#545BFF]/20 rounded-2xl p-5 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {/* Email Input */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-copy">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartshield.com"
                className="form-input w-full px-3 sm:px-4 py-2 sm:py-3 bg-inset border border-[#545BFF]/15 rounded-xl text-heading placeholder:text-faded text-sm sm:text-base focus:outline-none focus:border-[#545BFF]/45 focus:ring-2 focus:ring-[#545BFF]/25"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-copy">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input w-full px-3 sm:px-4 py-2 sm:py-3 bg-inset border border-[#545BFF]/15 rounded-xl text-heading placeholder:text-faded text-sm sm:text-base focus:outline-none focus:border-[#545BFF]/45 focus:ring-2 focus:ring-[#545BFF]/25"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-faded"
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-xs sm:text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Demo Credentials Info */}
            <div className="p-2.5 sm:p-3 bg-[#545BFF]/10 border border-[#545BFF]/25 rounded-xl">
              <p className="text-xs text-[#545BFF]/90">
                <span className="font-semibold">Demo Credentials:</span>
                <br />
                Email: admin@smartshield.com
                <br />
                Password: AdminSecure123!
              </p>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-button w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#545BFF] to-[#4349CD] text-heading font-semibold rounded-xl text-sm sm:text-base hover:shadow-lg disabled:opacity-50 transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-100 border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-faded">
          <p>
            Need help?{" "}
            <Link
              href="/contact"
              className="text-[#545BFF] hover:text-[#6B73FF] transition-colors"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
