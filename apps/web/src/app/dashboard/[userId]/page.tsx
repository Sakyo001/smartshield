"use client"
import { useSession } from "next-auth/react"

export default function UserInfo() {
  const { data: session } = useSession()

  if (!session) return <p>Not logged in</p>

  return <p>User ID: {session.user.id}</p>
}
