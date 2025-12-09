"use client";
import { useAuth } from "@lib/auth-context";
import { createClient } from "@lib/supabase";
import { syncUserToDatabase, linkSocialAccount } from "@lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserLoginForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.id}`);
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      // Sync user to users table on login
      await syncUserToDatabase(data.user.id, email);
      router.push(`/dashboard/${data.user.id}`);
    }
  };

  return (
    // Changed background to a soft gray for better contrast with the white card
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Main Card Container - Increased roundedness and shadow for a premium feel */}
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Left Side - Blue Section */}
        <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#545BFF] to-[#4338ca] p-12 flex-col items-center justify-center text-white overflow-hidden">
          {/* Subtle Background Pattern for texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          ></div>

          {/* Ambient Glow behind the shield */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 blur-[100px] rounded-full pointer-events-none"></div>

          {/* Heading */}
          <h2 className="text-3xl font-bold mb-8 text-center relative z-10 leading-tight">
            Securely manage your <br /> system and operations.
          </h2>

          {/* Shield Icon */}
          <div className="relative mb-10 z-10 transform hover:scale-105 transition-transform duration-500">
            <Image
              src="/images/loginlogo.png"
              alt="SmartShield Shield"
              width={320}
              height={320}
              className="drop-shadow-2xl"
              priority
            />
          </div>

          {/* Bottom Text */}
          <p className="text-center text-indigo-100 max-w-sm relative z-10 font-medium">
            Log in to access your tools and keep everything running smoothly.
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
          {/* Top Back Link */}
          <div className="absolute top-8 left-8 md:left-12">
            <Link
              href="/"
              className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                ←
              </span>{" "}
              Go back
            </Link>
          </div>

          {/* Logo Header */}
          <div className="mb-10 flex flex-col items-center mt-8 lg:mt-0">
            <div className="flex items-center gap-3 mb-2">
              <Image
                src="/images/miniloginlogo.png"
                alt="SmartShield"
                width={48}
                height={48}
                className="object-contain"
              />
              <div className="flex flex-col justify-center">
                <span className="text-black text-2xl font-bold tracking-wide leading-none">
                  SmartShield
                </span>
                <span className="font-medium text-[#5667FF] tracking-wide text-[10px] mt-1">
                  AI-Powered Phishing Detector
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-pulse">
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#545BFF]/10 focus:border-[#545BFF] transition-all duration-200"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs font-semibold text-[#545BFF] hover:text-[#4349dd]"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#545BFF]/10 focus:border-[#545BFF] transition-all duration-200"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center ml-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-[#545BFF] rounded border-gray-300 focus:ring-[#545BFF]"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-gray-600 cursor-pointer select-none"
              >
                Keep me signed in
              </label>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#545BFF] text-white rounded-xl font-bold hover:bg-[#4349dd] hover:shadow-lg hover:shadow-[#545BFF]/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width={20}
              height={20}
            />
            Sign in with Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 text-sm mt-8">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[#545BFF] hover:text-[#4349dd] hover:underline font-bold transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
