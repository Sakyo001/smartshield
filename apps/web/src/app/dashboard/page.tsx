import { createClient } from "@lib/supabase-server"
import { redirect } from "next/navigation"

export default async function DashboardRedirectPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Redirect to dynamic URL
  redirect(`/dashboard/${user.id}`)
}
