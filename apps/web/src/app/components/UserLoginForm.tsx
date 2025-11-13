// src/app/components/UserLoginForm.tsx
"use client"

import { signIn } from "next-auth/react"

export function UserLoginForm() {
  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="flex flex-col max-w-sm mx-auto p-4 border rounded text-center">
      <h2 className="text-xl font-bold mb-4">User Login</h2>
      <button
        onClick={handleGoogleLogin}
        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Sign in with Google
      </button>
    </div>
  )
}
