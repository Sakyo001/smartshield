import { redirect } from "next/navigation";

import Navbar from "@components/layout/Navbar";
import Footer from "@components/layout/Footer";
import ScanTab from "@components/sections/ScanTab";
import { createClient } from "@lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <ScanTab />
      <Footer />
    </div>
  );
}
