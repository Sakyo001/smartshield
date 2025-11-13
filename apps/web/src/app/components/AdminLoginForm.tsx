// src/app/components/AdminLoginForm.tsx
"use client"

import { signIn } from "next-auth/react"

export function AdminLoginForm() {
  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/admin/dashboard" })
  }

  return (
    <div className="flex flex-col max-w-sm mx-auto p-4 border rounded text-center">
      <h2 className="text-xl font-bold mb-4">Admin Login</h2>
      <button
        onClick={handleGoogleLogin}
        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Sign in with Google
      </button>
    </div>
  )
}
