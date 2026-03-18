import { redirect } from "next/navigation";

import Navbar from "@components/layout/Navbar";
import Footer from "@components/layout/Footer";
import AllScans from "@components/sections/AllScans";
import { createClient } from "@lib/supabase-server";

export default async function AllScansPage() {
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
        <AllScans />
      </div>
      <Footer />
    </div>
  );
}
