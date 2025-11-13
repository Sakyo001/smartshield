import auth from "@lib/auth"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session) redirect("/admin/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  return <div>Welcome Admin {session.user.name}</div>
}
