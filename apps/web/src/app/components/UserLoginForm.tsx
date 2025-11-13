// example in /app/login/page.tsx
"use client"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const { data: session } = useSession()

  if (session) {
    router.replace(`/dashboard/${session.user.id}`)
  }

  return (
    <div>
      <button onClick={() => signIn("credentials")}>Sign in</button>
    </div>
  )
}
