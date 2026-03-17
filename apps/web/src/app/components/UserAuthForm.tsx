"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient, syncUserToDatabase } from "@lib/supabase";

export function UserAuthForm() {
	const router = useRouter();
	const supabase = createClient();

	const getCallbackRedirectUrl = () => {
		if (typeof window === "undefined") {
			return "http://localhost:3001/auth/callback?next=/dashboard";
		}
		return `${window.location.origin}/auth/callback?next=/dashboard`;
	};

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
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
		<div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-black flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-800/55 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
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
					<h1 className="text-2xl sm:text-3xl font-bold text-white">Sign in to SmartShield</h1>
					<p className="mt-2 text-sm text-slate-300">
						Use your email and password or continue with Google.
					</p>
				</div>

				<form onSubmit={handleEmailLogin} className="space-y-4">
					<div className="space-y-1.5">
						<label htmlFor="email" className="text-sm font-medium text-slate-200">
							Email
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

					<div className="space-y-1.5">
						<label htmlFor="password" className="text-sm font-medium text-slate-200">
							Password
						</label>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? "Hide" : "Show"}
							</button>
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={isEmailLoading || isGoogleLoading}
						className="w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-65"
					>
						{isEmailLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<div className="my-5 flex items-center gap-3">
					<span className="h-px flex-1 bg-slate-600/70" />
					<span className="text-xs uppercase tracking-wide text-slate-400">or</span>
					<span className="h-px flex-1 bg-slate-600/70" />
				</div>

				<button
					type="button"
					onClick={handleGoogleLogin}
					disabled={isGoogleLoading || isEmailLoading}
					className="w-full rounded-lg border border-slate-500 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-white transition hover:border-slate-300 disabled:opacity-65"
				>
					{isGoogleLoading ? "Redirecting to Google..." : "Sign in with Google"}
				</button>

				<p className="mt-6 text-center text-xs text-slate-400">
					Don't have an account? <Link href="/signup" className="text-[#8d93ff] hover:text-[#b2b6ff] font-semibold">Sign up</Link>
				</p>
			</div>
		</div>
	);
}
