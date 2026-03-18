import { redirect } from "next/navigation";

import Navbar from "@components/layout/Navbar";
import Footer from "@components/layout/Footer";
import FAQTab from "@components/sections/FAQTab";
import { createClient } from "@lib/supabase-server";

export default async function DashboardFAQPage() {
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
      <div className="mt-20 md:mt-24">
        <FAQTab />
      </div>
      <Footer />
    </div>
  );
}
