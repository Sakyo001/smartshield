import { redirect } from "next/navigation";

import { createClient } from "@lib/supabase-server";

export default async function AdminIndexPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  redirect(adminUser ? "/admin/dashboard" : "/admin/login");
}
