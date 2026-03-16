"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@lib/supabase";

type UrlRow = {
  id: string;
  url: string;
  createdAt: string;
};

type ExtensionActivityRow = {
  id: string;
  url: string | null;
  created_at: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyUrl(
  row: ExtensionActivityRow
): row is ExtensionActivityRow & { url: string } {
  return isNonEmptyString(row.url);
}

export default function AdminUrlsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [rows, setRows] = useState<UrlRow[]>([]);
  const [exporting, setExporting] = useState(false);

  const onExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/admin/urls/export", { method: "GET" });

      if (!res.ok) {
        alert("Export failed. Please try again.");
        return;
      }

      const blob = await res.blob();

      const contentDisposition = res.headers.get("content-disposition") ?? "";
      const match = /filename=\"([^\"]+)\"/i.exec(contentDisposition);
      const filename = match?.[1] || "urls.csv";

      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user?.email) {
          router.push("/admin/login");
          return;
        }

        const { data: adminUser, error: adminError } = await supabase
          .from("admin_users")
          .select("email")
          .eq("email", user.email)
          .maybeSingle();

        if (adminError || !adminUser?.email) {
          router.push("/admin/login");
          return;
        }

        setAdminEmail(adminUser.email);

        const { data: activity, error: activityError } = await supabase
          .from("extension_activity")
          .select("id, url, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (activityError) {
          console.error("Error fetching extension_activity:", activityError);
          setRows([]);
          return;
        }

        const safeActivity = (activity ?? []) as ExtensionActivityRow[];

        const formatted: UrlRow[] = safeActivity
          .filter(hasNonEmptyUrl)
          .map((r) => ({
            id: r.id,
            url: r.url,
            createdAt: r.created_at,
          }));

        setRows(formatted);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">URLs</h1>
            <p className="text-sm text-gray-400">Newest to oldest</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-gray-400">
            <div>
              Admin: <span className="text-white font-medium">{adminEmail}</span>
            </div>
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exporting}
              className="inline-flex items-center justify-center rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:border-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-sm text-gray-300 hover:text-white underline underline-offset-4">
            Back to Dashboard
          </Link>
          <div className="text-sm text-gray-400">{rows.length.toLocaleString()} URLs</div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-800 bg-black/30">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 border-b border-gray-800">
            <div className="col-span-3">Date</div>
            <div className="col-span-9">URL</div>
          </div>

          <div className="divide-y divide-gray-800">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-3 px-4 py-3 text-sm">
                <div className="col-span-3 text-gray-300">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
                <div className="col-span-9">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:underline break-all"
                  >
                    {r.url}
                  </a>
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="px-4 py-8 text-sm text-gray-400">No URLs yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
