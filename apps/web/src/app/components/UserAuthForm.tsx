"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createClient, syncUserToDatabase } from "@lib/supabase";
import DotGridCanvas from "./ui/DotGridCanvas";

export function UserAuthForm() {
	const router = useRouter();
	const supabase = createClient();

	const getCallbackRedirectUrl = () => {
		const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
		const envOrigin =
			envSiteUrl && /^https?:\/\//i.test(envSiteUrl)
				? envSiteUrl.replace(/\/+$/, "")
				: null;

		const origin =
			envOrigin ??
			(typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

		return `${origin}/auth/callback?next=${encodeURIComponent("/")}`;
	};

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	// Load saved email and preference on mount
	useEffect(() => {
		const savedEmail = localStorage.getItem("lastEmail");
		const savedRememberMe = localStorage.getItem("staySignedIn") === "true";

		if (savedEmail) {
			setEmail(savedEmail);
			setRememberMe(savedRememberMe);
		}
	}, []);
	const [isEmailLoading, setIsEmailLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [error, setError] = useState("");

	const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setIsEmailLoading(true);

		try {
			const { data, error: authError } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (authError) {
				setError(authError.message || "Unable to sign in. Check your credentials.");
				return;
			}

			// Store stay signed in preference
			if (rememberMe) {
				localStorage.setItem("staySignedIn", "true");
				localStorage.setItem("lastEmail", email);
			} else {
				localStorage.removeItem("staySignedIn");
				localStorage.removeItem("lastEmail");
			}

			if (data.user?.id && data.user.email) {
				await syncUserToDatabase(
					data.user.id,
					data.user.email,
					data.user.user_metadata?.full_name || data.user.user_metadata?.name
				);
			}

			router.push("/");
			router.refresh();
		} catch (err) {
			console.error("Email login failed:", err);
			setError("Something went wrong while signing in.");
		} finally {
			setIsEmailLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setError("");
		setIsGoogleLoading(true);

		try {
			const callbackRedirectUrl = getCallbackRedirectUrl();
			const { error: oauthError } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: callbackRedirectUrl,
				},
			});

			if (oauthError) {
				setError(oauthError.message || "Google sign-in failed.");
				setIsGoogleLoading(false);
			}
		} catch (err) {
			console.error("Google login failed:", err);
			setError("Something went wrong while starting Google sign-in.");
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen w-full bg-page flex items-center justify-center px-4 py-10 overflow-hidden">
			<div className="absolute inset-0 z-[1] pointer-events-none">
				<DotGridCanvas maxNodes={22} />
			</div>

			{/* Subtly animated glow blob for depth */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[460px] h-[460px] md:w-[720px] md:h-[720px] rounded-full dark:bg-[#545BFF]/16 bg-[#545BFF]/12 blur-[100px] pointer-events-none transform-gpu animate-pulse" style={{ animationDuration: '4s' }} />

			<div className="relative z-[10] w-full max-w-md rounded-2xl border border-[#545BFF]/20 dark:bg-[#0d0e1a]/70 bg-white/85 backdrop-blur-xl shadow-[0_12px_40px_rgba(84,91,255,0.12)] dark:shadow-none p-6 sm:p-8 transition-[border-color,box-shadow] duration-300 hover:border-[#545BFF]/40">
				<button
					type="button"
					onClick={() => router.push("/")}
					className="mb-4 flex items-center gap-2 text-[13px] text-faded hover:text-heading transition"
					aria-label="Back to home"
				>
					<ArrowLeft size={16} />
					<span>Back to Home</span>
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
					<h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">Sign in to SmartShield</h1>
					<p className="mt-2 text-sm text-copy/75 font-light">
						Use your email and password or continue with Google.
					</p>
				</div>

				<form onSubmit={handleEmailLogin} className="space-y-4">
					<div className="space-y-1.5">
						<label htmlFor="email" className="block text-[13px] font-medium text-copy">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							className="w-full rounded-lg border border-[#545BFF]/20 dark:bg-[#0a0d1a]/50 bg-white/50 px-3.5 py-2.5 text-sm text-heading placeholder:text-faded focus:outline-none focus:border-[#545BFF]/50 focus:ring-1 focus:ring-[#545BFF]/50 backdrop-blur-sm transition-colors"
							required
						/>
					</div>

					<div className="space-y-1.5">
						<label htmlFor="password" className="block text-[13px] font-medium text-copy">
							Password
						</label>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								className="w-full rounded-lg border border-[#545BFF]/20 dark:bg-[#0a0d1a]/50 bg-white/50 px-3.5 py-2.5 pr-11 text-sm text-heading placeholder:text-faded focus:outline-none focus:border-[#545BFF]/50 focus:ring-1 focus:ring-[#545BFF]/50 backdrop-blur-sm transition-colors"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute inset-y-0 right-0 px-3 text-faded hover:text-copy"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 pt-1">
						<label className="flex items-center cursor-pointer group">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								className="w-4 h-4 rounded border-[#545BFF]/30 dark:bg-[#0a0d1a]/70 bg-white/50 text-[#545BFF] focus:ring-[#545BFF]/30 cursor-pointer"
							/>
							<span className="ml-2.5 text-[13px] text-copy/80 group-hover:text-copy transition-colors">Stay signed in</span>
						</label>
						<Link href="/forgot-password" className="text-[13px] font-medium text-[#545BFF] hover:text-[#6b72ff] dark:text-[#7c83ff] dark:hover:text-[#a3a8ff] transition-colors">
							Forgot password?
						</Link>
					</div>

					{error && (
						<div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 backdrop-blur-sm">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={isEmailLoading || isGoogleLoading}
						className="relative mt-2 w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF] py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(84,91,255,0.3)] hover:shadow-[0_0_32px_rgba(84,91,255,0.5)] hover:-translate-y-px transition-all duration-300 disabled:opacity-65 disabled:hover:translate-y-0 overflow-hidden group"
					>
						<span className="relative z-10">{isEmailLoading ? "Signing in..." : "Sign in"}</span>
					</button>
				</form>

				<div className="my-6 flex items-center gap-3">
					<span className="h-px flex-1 bg-divider/30" />
					<span className="text-[11px] font-medium uppercase tracking-wider text-faded/70">or continue with</span>
					<span className="h-px flex-1 bg-divider/30" />
				</div>

				<button
					type="button"
					onClick={handleGoogleLogin}
					disabled={isGoogleLoading || isEmailLoading}
					className="w-full flex justify-center items-center gap-2.5 rounded-lg border border-[#545BFF]/20 dark:bg-[#0d0e1a]/40 bg-white/60 px-4 py-2.5 text-sm font-semibold text-heading shadow-sm hover:border-[#545BFF]/40 dark:hover:bg-[#545BFF]/10 hover:bg-[#545BFF]/5 hover:-translate-y-px transition-all duration-300 disabled:opacity-65 disabled:hover:translate-y-0"
				>
					<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
					{isGoogleLoading ? "Redirecting..." : "Google"}
				</button>

				<p className="mt-7 text-center text-[13px] text-copy/70">
					Don't have an account? <Link href="/signup" className="text-[#545BFF] dark:text-[#7c83ff] hover:text-[#6b72ff] dark:hover:text-[#a3a8ff] font-semibold transition-colors">Sign up</Link>
				</p>
			</div>
		</div>
	);
}
