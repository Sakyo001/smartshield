// src/app/dashboard/page.tsx
import { authOptions } from "@lib/auth"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "user") {
    redirect("/login")
  }

  return <div>Welcome to User Dashboard</div>
}
