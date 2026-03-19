"use client";

import Aurora from "@components/ui/Aurora";
import { createClient } from "@lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

function tryGetHostname(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return u.hostname || "";
  } catch {
    return "";
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyUrl(
  row: ExtensionActivityRow,
): row is ExtensionActivityRow & { url: string } {
  return isNonEmptyString(row.url);
}

export default function AdminUrlsClient() {
  const router = useRouter();
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [rows, setRows] = useState<UrlRow[]>([]);
  const [totalScannedUrls, setTotalScannedUrls] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string>("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState(0);
  const lastUpdatedAtRef = useRef<string>("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    const byDomain =
      domainFilter === "all"
        ? rows
        : rows.filter((r) => tryGetHostname(r.url) === domainFilter);
    if (!normalizedQuery) return byDomain;
    return byDomain.filter((r) => {
      const host = tryGetHostname(r.url).toLowerCase();
      return (
        r.url.toLowerCase().includes(normalizedQuery) ||
        host.includes(normalizedQuery)
      );
    });
  }, [rows, domainFilter, normalizedQuery]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const host = tryGetHostname(r.url);
      if (host) set.add(host);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const uniqueDomainsCount = domains.length;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = filteredRows.slice(startIndex, endIndex);

  const refreshTotalScannedUrls = async (supabase: any) => {
    const { count, error } = await supabase
      .from("extension_activity")
      .select("id", { count: "exact", head: true })
      .not("url", "is", null)
      .neq("url", "");

    if (error) {
      console.error("Error fetching total scanned URLs:", error);
      return;
    }

    setTotalScannedUrls(count ?? 0);
  };

  const refreshRecentUrls = async (supabase: any) => {
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
    setCurrentPage(1);
    const now = new Date().toISOString();
    lastUpdatedAtRef.current = now;
    setLastUpdatedAt(now);
  };

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

  const onCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? "" : prev));
      }, 1200);
    } catch {
      alert("Copy failed. Please try again.");
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
        setIsAdminAuthenticated(true);

        await refreshRecentUrls(supabase);
        await refreshTotalScannedUrls(supabase);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleCountRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void refreshTotalScannedUrls(supabase);
      }, 150);
    };

    const channel = supabase
      .channel("admin-urls-total-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "extension_activity" },
        (payload) => {
          scheduleCountRefresh();
          setRealtimeEvents((n) => n + 1);
          const now = new Date().toISOString();
          lastUpdatedAtRef.current = now;
          setLastUpdatedAt(now);

          if (payload.eventType === "INSERT") {
            const next = payload.new as Partial<ExtensionActivityRow> | null;
            const nextUrl = next?.url;
            const nextId = next?.id;
            const nextCreatedAt = (next as any)?.created_at;
            if (
              typeof nextId === "string" &&
              isNonEmptyString(nextUrl) &&
              typeof nextCreatedAt === "string"
            ) {
              setRows((prev) => {
                if (prev.some((r) => r.id === nextId)) return prev;
                const newRow: UrlRow = {
                  id: nextId,
                  url: nextUrl,
                  createdAt: nextCreatedAt,
                };
                return [newRow, ...prev].slice(0, 200);
              });
            }
          }
        },
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isAdminAuthenticated]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, domainFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-heading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#545BFF]/15 bg-page/85 backdrop-blur relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <Aurora
            colorStops={["#545BFF", "#b19eef", "#545BFF"]}
            amplitude={1.1}
            blend={0.55}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-white font-semibold">URLs</h1>
              <p className="text-xs text-gray-300/80">
                Newest first · Live feed from extension activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span
                className={
                  realtimeConnected
                    ? "px-2 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/20"
                    : "px-2 py-1 rounded-full bg-gray-500/10 text-gray-300 border border-gray-500/20"
                }
              >
                {realtimeConnected ? "Live" : "Offline"}
              </span>
              <span className="text-gray-300/80">
                Updates:{" "}
                <span className="text-white font-medium">{realtimeEvents}</span>
              </span>
              {lastUpdatedAt && (
                <span className="text-gray-300/80">
                  Updated:{" "}
                  <span className="text-white font-medium">
                    {new Date(lastUpdatedAt).toLocaleTimeString()}
                  </span>
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-200/90">
              Admin:{" "}
              <span className="text-white font-medium">{adminEmail}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/admin/dashboard"
            className="group relative inline-flex items-center gap-2 px-5 h-10 rounded-full overflow-hidden border border-[#545BFF]/30 bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 text-heading text-sm font-semibold hover:border-[#545BFF]/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-0.5 transition-transform duration-200"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await Promise.all([
                  refreshRecentUrls(supabase),
                  refreshTotalScannedUrls(supabase),
                ]);
              }}
              className="group relative inline-flex items-center gap-2 px-5 h-10 rounded-full overflow-hidden
                bg-gradient-to-r from-[#545BFF]/20 to-[#6B73FF]/20 hover:from-[#545BFF]/30 hover:to-[#6B73FF]/30
                border border-[#545BFF]/30 hover:border-[#545BFF]/50
                text-white text-sm font-semibold
                shadow-[0_0_16px_rgba(84,91,255,0.2)] hover:shadow-[0_0_28px_rgba(84,91,255,0.35)]
                hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="relative z-10">Refresh</span>
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exporting}
              className="group relative inline-flex items-center gap-2 px-6 h-10 rounded-full overflow-hidden
                bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
                text-white text-sm font-semibold
                shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)]
                hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">
                {exporting ? "Exporting..." : "Export CSV"}
              </span>
              {!exporting && (
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              )}
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
            <p className="text-gray-400 text-sm mb-2">Total scanned URLs</p>
            <p className="text-3xl font-bold text-white">
              {totalScannedUrls.toLocaleString()}
            </p>
            <p className="text-[#545BFF] text-xs mt-2">
              All-time (non-empty URLs)
            </p>
          </div>
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
            <p className="text-gray-400 text-sm mb-2">Loaded (latest 200)</p>
            <p className="text-3xl font-bold text-white">
              {rows.length.toLocaleString()}
            </p>
            <p className="text-[#545BFF] text-xs mt-2">Searchable & pageable</p>
          </div>
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
            <p className="text-gray-400 text-sm mb-2">Unique domains</p>
            <p className="text-3xl font-bold text-white">
              {uniqueDomainsCount.toLocaleString()}
            </p>
            <p className="text-[#545BFF] text-xs mt-2">Across loaded URLs</p>
          </div>
        </section>

        <section className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
          <div className="p-6 border-b border-[#545BFF]/15 bg-gradient-to-r from-page/25 to-transparent">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-white font-semibold">Recent URLs</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Filter by domain and search by URL/hostname
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search URLs…"
                  className="w-full sm:w-72 rounded-xl border border-[#545BFF]/15 bg-panel/60 dark:bg-black/30 px-3 py-2 text-sm text-heading placeholder:text-faded/60 focus:outline-none focus:ring-2 focus:ring-[#545BFF]/25"
                />
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="rounded-xl border border-[#545BFF]/15 bg-panel/60 dark:bg-black/30 px-3 py-2 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-[#545BFF]/25"
                >
                  <option value="all">All domains</option>
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-panel/55 dark:bg-black/20 border-b border-[#545BFF]/15">
                <tr>
                  {["Date", "Domain", "URL", ""].map((header) => (
                    <th
                      key={header || "actions"}
                      className={
                        header
                          ? "px-6 py-3 text-left text-xs font-semibold text-gray-300"
                          : "px-6 py-3 text-right text-xs font-semibold text-gray-300"
                      }
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {pageRows.map((r) => {
                  const host = tryGetHostname(r.url);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-panel/40 dark:hover:bg-black/20 transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 group-hover:text-white transition-colors">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-panel/40 dark:bg-black/25 border border-[#545BFF]/15 text-xs text-heading">
                          {host || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 group-hover:text-white transition-colors">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline break-all"
                        >
                          {r.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void onCopyUrl(r.id, r.url)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#545BFF]/18 to-[#4349CD]/18 hover:from-[#545BFF]/28 hover:to-[#4349CD]/28 border border-[#545BFF]/28 hover:border-[#545BFF]/45 text-xs font-medium text-heading transition-all duration-300"
                          >
                            {copiedId === r.id ? "Copied" : "Copy"}
                          </button>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-[#545BFF]/15 bg-panel/50 text-xs font-medium text-heading hover:border-[#545BFF]/30 transition-colors"
                          >
                            Open
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-sm text-gray-400"
                    >
                      {rows.length === 0
                        ? "No URLs yet."
                        : "No results. Try clearing filters/search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRows.length > 0 && (
            <div className="p-6 border-t border-[#545BFF]/15 flex items-center justify-between text-sm text-faded flex-wrap gap-3">
              <div>
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredRows.length)} of{" "}
                {filteredRows.length.toLocaleString()}
                {filteredRows.length !== rows.length && (
                  <span className="text-gray-500">
                    {" "}
                    (filtered from {rows.length.toLocaleString()})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center justify-center rounded-full border border-[#545BFF]/30 bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 px-4 py-1.5 text-xs font-medium text-heading hover:border-[#545BFF]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                >
                  Previous
                </button>
                <span className="min-w-24 text-center text-gray-300">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center justify-center rounded-full border border-[#545BFF]/30 bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 px-4 py-1.5 text-xs font-medium text-heading hover:border-[#545BFF]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
