"use client";

import Aurora from "@components/ui/Aurora";
import ThemeToggle from "@components/ui/ThemeToggle";
import { createClient } from "@lib/supabase";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function normalizeDecision(
  decision: unknown,
): "dangerous" | "warning" | "safe" {
  if (decision === "dangerous" || decision === "warning" || decision === "safe")
    return decision;
  if (decision === "PHISHING") return "dangerous";
  if (decision === "LEGITIMATE") return "safe";
  return "warning";
}

function getDayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // en-CA produces YYYY-MM-DD in local time.
  return date.toLocaleDateString("en-CA");
}

function IconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconExclamationCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 2v4M16 2v4" />
      <path d="M3 10h18" />
      <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconMessageCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconInfoCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function createLast7DaysTemplate(): Record<string, number> {
  const template: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    template[getDayKey(date)] = 0;
  }
  return template;
}

function formatActivityRow(report: any) {
  const createdAt = report?.created_at || new Date().toISOString();
  const decision = report?.decision;
  const d = normalizeDecision(decision);
  const risk =
    d === "dangerous" ? "Phishing" : d === "safe" ? "Legitimate" : "Suspicious";

  return {
    id: report?.id,
    createdAt,
    date: new Date(createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    url:
      typeof report?.url === "string" && report.url.length > 0
        ? report.url
        : "(unknown URL)",
    domain: report?.domain || "",
    confidence: report?.confidence ?? null,
    decision: decision || "",
    prediction: report?.prediction || null,
    risk,
    feedback: true,
  };
}

function buildUrlCandidates(rawUrl: string): string[] {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return [];

  const candidates = new Set<string>([trimmed]);

  // Handle trailing slash differences between scan URLs and user-submitted report URLs.
  if (trimmed.endsWith("/")) {
    candidates.add(trimmed.slice(0, -1));
  } else {
    candidates.add(`${trimmed}/`);
  }

  try {
    const parsed = new URL(trimmed);
    const normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
    candidates.add(normalized);
    if (normalized.endsWith("/")) {
      candidates.add(normalized.slice(0, -1));
    } else {
      candidates.add(`${normalized}/`);
    }
  } catch {
    // Ignore invalid URLs and keep string-based candidates only.
  }

  return Array.from(candidates).filter((value) => value.length > 0);
}

export default function AdminDashboardClient() {
  const WHOIS_API_URL = process.env.NEXT_PUBLIC_WHOIS_API_URL;
  const router = useRouter();
  const pathname = usePathname();
  const activeUserIdsRef = useRef<Set<string>>(new Set());
  const processedRealtimeScanIdsRef = useRef<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scanData, setScanData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    phishing: 0,
    suspicious: 0,
    legitimate: 0,
  });
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [dailyScanData, setDailyScanData] = useState<{ [key: string]: number }>(
    {},
  );
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [communityReportCounts, setCommunityReportCounts] = useState<
    Record<string, number>
  >({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState(0);

  // Authentication Check with Supabase
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient();

        // Get current user session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/admin/login");
          return;
        }

        // Check if user exists in admin_users table
        const { data: adminUser, error: adminError } = await supabase
          .from("admin_users")
          .select("email, display_name")
          .eq("email", user.email)
          .maybeSingle();

        if (adminError || !adminUser) {
          console.error("User is not an admin");
          router.push("/admin/login");
          return;
        }

        // User is authenticated and is an admin
        setAdminEmail(adminUser.email);
        setIsAuthenticated(true);
        // Fetch reports after auth
        await fetchReports(supabase);
        setLoading(false);
      } catch (err) {
        console.error("Error checking admin status:", err);
        router.push("/admin/login");
      }
    };

    checkAdmin();
  }, [router]);

  // Fetch reports from Supabase
  const fetchRecentScanActivity = async (supabase: any) => {
    const { data: reports, error } = await supabase
      .from("extension_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error(
        "Error fetching recent scan activity:",
        error.message || JSON.stringify(error),
      );
      return;
    }

    if (reports && reports.length > 0) {
      const formattedData = reports.map((report: any) =>
        formatActivityRow(report),
      );
      const uniqueUrls = Array.from(
        new Set(
          formattedData
            .map((row: any) => row.url)
            .filter(
              (url: unknown): url is string =>
                typeof url === "string" &&
                url.length > 0 &&
                url !== "(unknown URL)",
            ),
        ),
      );

      let reportCountMap: Record<string, number> = {};
      if (uniqueUrls.length > 0) {
        const { data: communityRows, error: communityError } = await supabase
          .from("reports")
          .select("url")
          .in("url", uniqueUrls);

        if (communityError) {
          console.error(
            "Error fetching community report counts:",
            communityError.message || JSON.stringify(communityError),
          );
        } else if (communityRows) {
          reportCountMap = communityRows.reduce(
            (acc: Record<string, number>, row: any) => {
              if (typeof row?.url === "string" && row.url.length > 0) {
                acc[row.url] = (acc[row.url] ?? 0) + 1;
              }
              return acc;
            },
            {},
          );
        }
      }

      setCommunityReportCounts(reportCountMap);

      const withCommunityCount = formattedData.map((row: any) => ({
        ...row,
        reportCount: reportCountMap[row.url] ?? 0,
      }));

      withCommunityCount.sort(
        (a: any, b: any) =>
          (Date.parse(b.createdAt ?? "") || 0) -
          (Date.parse(a.createdAt ?? "") || 0),
      );
      setScanData(withCommunityCount);
      return;
    }

    setScanData([]);
    setCommunityReportCounts({});
  };

  const fetchReports = async (supabase: any) => {
    try {
      await fetchRecentScanActivity(supabase);

      // Fetch all reports for stats calculation
      const { data: allReports, error: reportsError } = await supabase
        .from("extension_activity")
        .select("decision");

      if (reportsError) {
        console.error(
          "Error fetching all reports:",
          reportsError.message || JSON.stringify(reportsError),
        );
        return;
      }

      if (allReports) {
        const phishingCount = allReports.filter(
          (r: any) => normalizeDecision(r.decision) === "dangerous",
        ).length;
        const legitimateCount = allReports.filter(
          (r: any) => normalizeDecision(r.decision) === "safe",
        ).length;
        const suspiciousCount = allReports.filter(
          (r: any) => normalizeDecision(r.decision) === "warning",
        ).length;

        setStats({
          phishing: phishingCount,
          suspicious: suspiciousCount,
          legitimate: legitimateCount,
        });
        setTotalScans(allReports.length);
      }

      // Fetch all users
      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("id, email, last_login");

      if (usersError) {
        console.error(
          "Error fetching users:",
          usersError.message || JSON.stringify(usersError),
        );
        return;
      }

      if (allUsers) {
        setTotalUsers(allUsers.length);

        // Count active users (those with scans in the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const { data: recentScans, error: scansError } = await supabase
          .from("extension_activity")
          .select("user_id, created_at")
          .gte("created_at", sevenDaysAgo.toISOString());

        if (scansError) {
          console.error(
            "Error fetching recent scans:",
            scansError.message || JSON.stringify(scansError),
          );
          return;
        }

        if (recentScans) {
          // Count unique users from last 7 days
          const uniqueUsers = new Set<string>(
            recentScans
              .map((scan: any) => scan.user_id)
              .filter(
                (id: unknown): id is string =>
                  typeof id === "string" && id.length > 0,
              ),
          );
          activeUserIdsRef.current = uniqueUsers;
          setActiveUsers(uniqueUsers.size);

          // Calculate daily scan counts for last 7 days
          const dailyData = createLast7DaysTemplate();

          recentScans.forEach((scan: any) => {
            const dateStr = getDayKey(scan.created_at);
            if (
              dateStr &&
              Object.prototype.hasOwnProperty.call(dailyData, dateStr)
            ) {
              dailyData[dateStr]++;
            }
          });

          setDailyScanData(dailyData);
        }
      }
    } catch (err: any) {
      console.error("Error in fetchReports:", err?.message || err);
    }
  };

  // Realtime updates: monitor new scan activity as it happens
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const supabase = createClient();
    let syncing = false;
    let needsResync = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let recentDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const runSync = async () => {
      if (syncing) {
        needsResync = true;
        return;
      }

      syncing = true;
      try {
        await fetchReports(supabase);
      } finally {
        syncing = false;
      }

      if (needsResync) {
        needsResync = false;
        void runSync();
      }
    };

    const scheduleSync = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void runSync();
      }, 250);
    };

    const scheduleRecentSync = () => {
      if (recentDebounceTimer) {
        clearTimeout(recentDebounceTimer);
      }
      recentDebounceTimer = setTimeout(() => {
        recentDebounceTimer = null;
        void fetchRecentScanActivity(supabase);
      }, 120);
    };

    const channel = supabase
      .channel("admin-extension-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "extension_activity" },
        async (payload: any) => {
          try {
            setRealtimeEvents((n) => n + 1);

            // Optimistically append INSERT rows so activity appears instantly.
            if (payload?.eventType === "INSERT" && payload?.new?.id) {
              const insertedId = String(payload.new.id);
              if (processedRealtimeScanIdsRef.current.has(insertedId)) {
                scheduleSync();
                return;
              }

              processedRealtimeScanIdsRef.current.add(insertedId);
              if (processedRealtimeScanIdsRef.current.size > 5000) {
                processedRealtimeScanIdsRef.current.clear();
                processedRealtimeScanIdsRef.current.add(insertedId);
              }

              const row = formatActivityRow(payload.new);
              setScanData((prev) => {
                if (prev.some((r: any) => r?.id === row.id)) return prev;
                return [
                  { ...row, reportCount: communityReportCounts[row.url] ?? 0 },
                  ...prev,
                ].slice(0, 10);
              });

              const decision = normalizeDecision(payload?.new?.decision);
              setStats((prev) => ({
                phishing: prev.phishing + (decision === "dangerous" ? 1 : 0),
                suspicious: prev.suspicious + (decision === "warning" ? 1 : 0),
                legitimate: prev.legitimate + (decision === "safe" ? 1 : 0),
              }));
              setTotalScans((prev) => prev + 1);

              const createdAtValue =
                typeof payload?.new?.created_at === "string" &&
                payload.new.created_at.length > 0
                  ? payload.new.created_at
                  : new Date();
              const dateKey = getDayKey(createdAtValue);
              setDailyScanData((prev) => {
                const next =
                  Object.keys(prev).length > 0
                    ? { ...prev }
                    : createLast7DaysTemplate();
                if (
                  dateKey &&
                  Object.prototype.hasOwnProperty.call(next, dateKey)
                ) {
                  next[dateKey] = (next[dateKey] ?? 0) + 1;
                }
                return next;
              });

              const userId = payload?.new?.user_id;
              if (
                typeof userId === "string" &&
                userId.length > 0 &&
                !activeUserIdsRef.current.has(userId)
              ) {
                activeUserIdsRef.current.add(userId);
                setActiveUsers(activeUserIdsRef.current.size);
              }
            }

            scheduleRecentSync();
            scheduleSync();
          } catch (err) {
            console.error(
              "Realtime extension_activity insert handling failed:",
              err,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        async () => {
          try {
            setRealtimeEvents((n) => n + 1);
            scheduleSync();
          } catch (err) {
            console.error("Realtime users sync failed:", err);
          }
        },
      )
      .subscribe((status: any) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (recentDebounceTimer) {
        clearTimeout(recentDebounceTimer);
      }
      setRealtimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, loading, communityReportCounts]);

  // AJAX-style polling fallback so dashboard stays fresh even if a realtime
  // event is missed due to intermittent network/mobile conditions.
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const supabase = createClient();
    let polling = false;

    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        await fetchReports(supabase);
      } finally {
        polling = false;
      }
    };

    // Prime immediately after auth/load.
    void poll();

    const interval = setInterval(() => {
      void poll();
    }, 4000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated, loading]);

  // Fast polling path for Recent Scan Activity only.
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const supabase = createClient();
    let polling = false;

    const pollRecent = async () => {
      if (polling) return;
      polling = true;
      try {
        await fetchRecentScanActivity(supabase);
      } finally {
        polling = false;
      }
    };

    void pollRecent();
    const interval = setInterval(() => {
      void pollRecent();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, loading]);

  // Scroll effect listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut for modal (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedFeedback) {
        closeFeedbackModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFeedback]);

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      const supabase = createClient();

      // Clear auth cookies server-side (authoritative for middleware)
      await fetch("/api/admin/logout", { method: "POST" });

      // Also clear any in-memory client state
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLogoutLoading(false);
    }

    // Hard navigation so middleware runs with updated cookies
    window.location.assign("/admin/login");
  };

  const fetchComments = async (url: string) => {
    setCommentsLoading(true);
    try {
      const supabase = createClient();
      const urlCandidates = buildUrlCandidates(url);

      let reports: any[] = [];

      // Prefer the same API source used by the user dashboard comments panel.
      if (WHOIS_API_URL) {
        const candidates = urlCandidates.length > 0 ? urlCandidates : [url];
        const reportMap = new Map<string, any>();

        for (const candidate of candidates) {
          try {
            const res = await fetch(
              `${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(candidate)}`,
            );
            if (!res.ok) continue;
            const data = await res.json();
            const rows = Array.isArray(data?.reports) ? data.reports : [];

            for (const row of rows) {
              const key = String(
                row?.id ??
                  `${row?.url ?? ""}-${row?.user_id ?? ""}-${row?.created_at ?? ""}`,
              );
              if (!reportMap.has(key)) {
                reportMap.set(key, row);
              }
            }
          } catch {
            // Ignore candidate-level errors; fallback paths below will handle empty results.
          }
        }

        reports = Array.from(reportMap.values()).sort(
          (a: any, b: any) =>
            (Date.parse(b?.created_at ?? "") || 0) -
            (Date.parse(a?.created_at ?? "") || 0),
        );
      }

      // Fallback to direct Supabase query if API returned nothing.
      if (reports.length === 0) {
        const { data: exactReports, error } = await supabase
          .from("reports")
          .select("id, url, description, flag, created_at, user_id")
          .in("url", urlCandidates.length > 0 ? urlCandidates : [url])
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching reports - Full error object:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
        } else {
          reports = exactReports || [];
        }
      }

      // Fallback: if there are no exact matches, fetch reports by domain pattern.
      if (reports.length === 0) {
        try {
          const parsed = new URL(url);
          const domain = parsed.hostname;
          if (domain) {
            const { data: domainReports, error: domainError } = await supabase
              .from("reports")
              .select("id, url, description, flag, created_at, user_id")
              .ilike("url", `%${domain}%`)
              .order("created_at", { ascending: false })
              .limit(50);

            if (domainError) {
              console.error(
                "Error fetching reports by domain:",
                domainError.message || JSON.stringify(domainError),
              );
            } else {
              reports = domainReports || [];
            }
          }
        } catch {
          // Keep exact match result only when URL cannot be parsed.
        }
      }

      if (!reports || reports.length === 0) {
        setComments([]);
        return;
      }

      // Fetch user info separately
      const userIds = [...new Set(reports.map((r: any) => r.user_id))];
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email, display_name")
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      const userMap = new Map(
        users?.map((u: any) => [
          u.id,
          { email: u.email, display_name: u.display_name },
        ]) || [],
      );

      // Format comments with user data
      const formattedComments = reports.map((r: any) => {
        const user = userMap.get(r.user_id) || {
          email: "Unknown",
          display_name: "Anonymous",
        };
        return {
          id: r.id,
          url: r.url,
          author: user.display_name || user.email || "Anonymous",
          comment: r.description,
          flag: r.flag,
          date: new Date(r.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

      setComments(formattedComments);
    } catch (err: any) {
      console.error("Error in fetchComments:", err?.message || err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleFeedbackClick = async (item: any) => {
    setSelectedFeedback(item);
    setCopiedUrl(false);
    await fetchComments(item.url);
  };

  const closeFeedbackModal = () => {
    setSelectedFeedback(null);
    setCopiedUrl(false);
  };

  const copySelectedUrl = async () => {
    const url = selectedFeedback?.url;
    if (typeof url !== "string" || url.length === 0) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 1200);
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopiedUrl(true);
        window.setTimeout(() => setCopiedUrl(false), 1200);
      } catch {
        // ignore
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-heading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Phishing":
        return "bg-red-500";
      case "Suspicious":
        return "bg-yellow-500";
      case "Legitimate":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-page text-heading transition-colors duration-300">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes indicatorPulse {
          0%, 100% {
            background-color: rgb(255, 255, 255);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          50% {
            background-color: rgb(229, 231, 235);
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0);
          }
        }

        .dashboard-content {
          animation: slideIn 0.6s ease-out;
        }

        .stat-card {
          animation: fadeInScale 0.5s ease-out backwards;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(107, 115, 255, 0.1);
        }

        .nav-link {
          position: relative;
          transition: color 0.3s ease;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: #545BFF;
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .logout-button {
          transition: all 0.3s ease;
        }

        .logout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(107, 115, 255, 0.2);
        }
      `}</style>

      {/* Navbar with Enhanced Design */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "py-2 bg-gray-950/95 backdrop-blur-xl border-b border-[#545BFF]/25 shadow-[0_1px_32px_rgba(84,91,255,0.12)]"
            : "py-4 bg-transparent border-b border-transparent"
        }`}
      >
        {/* Gradient glow line at bottom edge — visible on scroll */}
        <div
          className={`absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/55 to-transparent pointer-events-none transition-opacity duration-500 ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Subtle cyber dot grid — techy feel when scrolled */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isScrolled ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(84,91,255,0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* HUD corner brackets — top-left & top-right */}
        <div
          className={`pointer-events-none absolute top-0 left-0 transition-opacity duration-500 ${isScrolled ? "opacity-100" : "opacity-0"}`}
        >
          <span className="block w-4 h-4 border-t-2 border-l-2 border-[#545BFF]/40 rounded-tl-sm" />
        </div>
        <div
          className={`pointer-events-none absolute top-0 right-0 transition-opacity duration-500 ${isScrolled ? "opacity-100" : "opacity-0"}`}
        >
          <span className="block w-4 h-4 border-t-2 border-r-2 border-[#545BFF]/40 rounded-tr-sm" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between relative z-10">
          {/* Logo Section */}
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 sm:gap-3 group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {/* Image area — all hover FX scoped here */}
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0
                transition-all duration-500
                group-hover:scale-105
                group-hover:drop-shadow-[0_0_22px_rgba(84,91,255,0.65)]"
            >
              {/* Always-rotating dashed orbit ring — fades in on hover */}
              <motion.div
                className="absolute inset-[-7px] rounded-full border border-dashed
                  border-[#545BFF]/0 group-hover:border-[#545BFF]/40
                  transition-colors duration-300 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />

              {/* Solid pulse ring — expands on hover */}
              <div
                className="absolute inset-[-2px] rounded-full border border-[#545BFF]/0
                group-hover:border-[#545BFF]/20 scale-95 group-hover:scale-110
                transition-all duration-500 pointer-events-none"
              />

              {/* HUD corner brackets — slide outward on hover */}
              <span
                className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:-translate-x-1 group-hover:-translate-y-1
                transition-all duration-300 pointer-events-none"
              />
              <span
                className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:translate-x-1 group-hover:-translate-y-1
                transition-all duration-300 pointer-events-none"
              />
              <span
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:-translate-x-1 group-hover:translate-y-1
                transition-all duration-300 pointer-events-none"
              />
              <span
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:translate-x-1 group-hover:translate-y-1
                transition-all duration-300 pointer-events-none"
              />

              {/* Logo image */}
              <Image
                src="/images/logo 1.png"
                alt="SmartShield Logo"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />

              {/* Status dot — Protection Active */}
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span
                  className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-400 border-[1.5px] border-page"
                  style={{ boxShadow: "0 0 6px rgba(52,211,153,0.9)" }}
                />
              </span>
            </div>

            {/* Text block — subtle rightward nudge on hover */}
            <div className="flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-0.5">
              <span
                className={`text-lg sm:text-xl md:text-2xl tracking-wide font-bold leading-none ${
                  isScrolled ? "text-white" : "text-heading"
                }`}
              >
                SmartShield
              </span>
              <span className="font-medium text-[#a89de8] dark:text-[#a89de8] tracking-wide text-[9px] sm:text-[10px] md:text-xs mt-0.5 transition-colors duration-300 group-hover:text-[#b19eef]">
                Admin Panel
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5">
            {["Dashboard", "URLs", "Settings"].map((item) => {
              const href =
                item === "URLs"
                  ? "/admin/urls"
                  : item === "Settings"
                    ? "/admin/settings"
                    : "/admin/dashboard";
              const isActive = pathname === href;
              return (
                <Link
                  key={item}
                  href={href}
                  className={`relative px-5 py-2 text-sm rounded-full transition-colors duration-300 font-medium ${
                    isActive
                      ? "text-[#545BFF] dark:text-[#7c83ff] font-semibold"
                      : isScrolled
                        ? "text-gray-200 hover:text-white"
                        : "text-faded hover:text-[#545BFF]"
                  }`}
                >
                  {/* Sliding glass pill — morphs between active items */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-bg-pill"
                      className="absolute inset-0 rounded-full bg-[#545BFF]/10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                  {/* Glowing pip dot under active link */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pip"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#545BFF]"
                      style={{ boxShadow: "0 0 7px rgba(84,91,255,0.9)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`text-sm hidden sm:block ${
                isScrolled ? "text-gray-300" : "text-faded"
              }`}
            >
              Admin:{" "}
              <span className={isScrolled ? "text-white font-medium" : "text-copy font-medium"}>
                {adminEmail}
              </span>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className={`group relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full overflow-hidden
                bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
                text-white
                shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)]
                hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {logoutLoading ? "Logging out..." : "Logout"}
              </span>
              {/* Shimmer sweep */}
              {!logoutLoading && (
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content pt-24 max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-heading mb-2">Hello, Admin</h1>
          <p className="text-faded">
            Welcome to the SmartShield admin dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Scans */}
          <div
            className="stat-card bg-panel border border-divider hover:border-[#6B73FF]/40 rounded-lg p-6 backdrop-blur-sm"
            style={{ animationDelay: "0s" }}
          >
            <p className="text-faded text-sm mb-2">Total Scans</p>
            <p className="text-3xl font-bold text-copy">{totalScans.toLocaleString()}</p>
            <p className="text-blue-400 text-xs mt-2">All security scans</p>
          </div>

          {/* Threats Detected */}
          <div
            className="stat-card bg-panel border border-divider hover:border-[#6B73FF]/40 rounded-lg p-6 backdrop-blur-sm"
            style={{ animationDelay: "0.1s" }}
          >
            <p className="text-faded text-sm mb-2">Threats Detected</p>
            <p className="text-3xl font-bold text-red-400">{stats.phishing.toLocaleString()}</p>
            <p className="text-red-400 text-xs mt-2">Phishing URLs blocked</p>
          </div>

          {/* Active Users - Realtime */}
          <div
            className="stat-card bg-gradient-to-br from-panel via-panel to-panel/70 border-2 border-emerald-400/50 hover:border-emerald-400/80 rounded-lg p-6 backdrop-blur-sm relative overflow-hidden group"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-emerald-400 transition-opacity duration-300 pointer-events-none" />

            {/* Live indicator with animation */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <motion.span
                className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs font-bold text-emerald-300 tracking-widest">LIVE</span>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <p className="text-faded text-sm mb-3 font-medium">Active Users</p>
              
              {/* Large active user count with gradient */}
              <div className="flex items-baseline gap-3 mb-3">
                <motion.p
                  className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  {activeUsers.toLocaleString()}
                </motion.p>
                <span className="text-sm text-faded">now</span>
              </div>

              {/* Connection status */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span
                  className={`inline-block px-2 py-1 rounded-full font-medium transition-all ${
                    realtimeConnected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  }`}
                >
                  {realtimeConnected ? "✓ Real-time" : "⟳ Syncing..."}
                </span>
              </div>
            </div>
          </div>

          {/* Detection Accuracy */}
          <div
            className="stat-card bg-panel border border-divider hover:border-[#6B73FF]/40 rounded-lg p-6 backdrop-blur-sm"
            style={{ animationDelay: "0.3s" }}
          >
            <p className="text-faded text-sm mb-2">Detection Accuracy</p>
            <p className="text-3xl font-bold text-green-400">97.7%</p>
            <p className="text-green-400 text-xs mt-2">Phishing detection rate</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-panel border border-divider rounded-lg p-6 backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
            <h2 className="text-heading font-semibold mb-4">
              Scan Activity (Last 7 Days)
            </h2>
            <div className="h-64 flex items-end justify-around gap-2 bg-inset rounded p-4">
              {(() => {
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  dates.push(date);
                }

                const maxScans = Math.max(
                  ...dates.map((d) => dailyScanData[getDayKey(d)] || 0),
                  1,
                );

                return dates.map((date, idx) => {
                  const dateStr = getDayKey(date);
                  const scans = dailyScanData[dateStr] || 0;
                  const heightPercent =
                    maxScans > 0 ? (scans / maxScans) * 100 : 0;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2 flex-1"
                    >
                      <div
                        className="w-full rounded bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 transition-all relative group"
                        style={{ height: `${heightPercent}px` || "20px" }}
                        title={`${dateStr}: ${scans} scans`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-panel text-copy text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {scans} scans
                        </div>
                      </div>
                      <span className="text-xs text-faded">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-panel border border-divider rounded-lg p-6 backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
            <h2 className="text-heading font-semibold mb-4">Total Scan</h2>
            <div className="flex flex-col items-center gap-4">
              {(() => {
                const total =
                  stats.phishing + stats.suspicious + stats.legitimate;
                const phishingPercent =
                  total > 0 ? (stats.phishing / total) * 100 : 0;
                const suspiciousPercent =
                  total > 0 ? (stats.suspicious / total) * 100 : 0;
                const legitimatePercent =
                  total > 0 ? (stats.legitimate / total) * 100 : 0;
                const breakdown = [
                  {
                    label: "Phishing",
                    count: stats.phishing,
                    percent: phishingPercent,
                    dot: "bg-red-500",
                    text: "text-red-300",
                  },
                  {
                    label: "Suspicious",
                    count: stats.suspicious,
                    percent: suspiciousPercent,
                    dot: "bg-orange-500",
                    text: "text-orange-300",
                  },
                  {
                    label: "Legitimate",
                    count: stats.legitimate,
                    percent: legitimatePercent,
                    dot: "bg-green-500",
                    text: "text-green-300",
                  },
                ];

                return (
                  <>
                    <div
                      className="w-40 h-40 rounded-full border-8 border-gray-800 flex items-center justify-center relative hover:scale-105 transition-transform duration-300"
                      style={{
                        background: `conic-gradient(#ef4444 0deg ${phishingPercent * 3.6}deg, #eab308 ${phishingPercent * 3.6}deg ${(phishingPercent + suspiciousPercent) * 3.6}deg, #10b981 ${(phishingPercent + suspiciousPercent) * 3.6}deg)`,
                      }}
                    >
                      <div className="w-32 h-32 rounded-full bg-panel flex items-center justify-center z-10">
                        <div className="text-center leading-tight">
                          <div className="text-[11px] uppercase tracking-wide text-faded">
                            Total
                          </div>
                          <div className="text-xl font-bold text-heading">
                            {total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                      {breakdown.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-md border border-divider bg-panel/40 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                            />
                            <span className={`text-sm ${item.text}`}>
                              {item.label}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-heading">
                              {item.percent.toFixed(1)}%
                            </div>
                            <div className="text-[11px] text-gray-600">
                              {item.count.toLocaleString()} scans
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-panel border border-divider rounded-lg overflow-hidden backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
          <div className="p-6 border-b border-divider bg-panel/60">
            <div className="flex items-center justify-between">
              <h2 className="text-heading font-semibold">
                Recent Scan Activity
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={
                    realtimeConnected
                      ? "px-2 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/20"
                      : "px-2 py-1 rounded-full bg-gray-500/10 text-faded border border-gray-500/20"
                  }
                >
                  {realtimeConnected ? "Live" : "Offline"}
                </span>
                <span className="text-faded">Updates: {realtimeEvents}</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-panel/55 dark:bg-gray-900 border-b border-divider">
                <tr>
                  {["Date", "URL", "Risk", "Feedback"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-semibold text-faded"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/40">
                {scanData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-inset/40 dark:hover:bg-gray-800/30 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 text-sm text-copy group-hover:text-heading transition-colors">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-copy truncate max-w-[200px] group-hover:text-heading transition-colors">
                      {item.url}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium text-gray-100 ${getRiskColor(item.risk)} hover:scale-110 transition-transform`}
                      >
                        {item.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleFeedbackClick(item)}
                        className="relative p-2 bg-gradient-to-r from-[#6B73FF]/20 to-[#5A62E8]/20 hover:from-[#6B73FF]/40 hover:to-[#5A62E8]/40 border border-[#6B73FF]/30 hover:border-[#6B73FF]/60 rounded-lg transition-all duration-300 hover:scale-105 inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-[#6B73FF]/20 group"
                        title={`View community reports (${item.reportCount ?? 0})`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#6B73FF] group-hover:scale-110 transition-transform duration-200"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {(item.reportCount ?? 0) > 0 && (
                          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-gray-100 bg-gradient-to-r from-[#6B73FF] to-[#5A62E8] rounded-full shadow-lg animate-pulse">
                            {item.reportCount}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback Modal */}
        {selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Feedback and risk report"
            onClick={closeFeedbackModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{
                duration: 0.4,
                type: "spring",
                stiffness: 120,
                damping: 22,
              }}
              className="bg-gray-950 border border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated ambient background glows */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute -top-40 -right-40 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl pointer-events-none"
              ></motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-800/20 rounded-full blur-3xl pointer-events-none"
              ></motion.div>

              {/* Header with professional styling */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-gray-950/90 backdrop-blur border-b border-gray-800 px-6 sm:px-8 py-5 sm:py-7 flex items-center justify-between relative z-20 sticky top-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="relative w-10 h-10 flex-shrink-0"
                    >
                      <Image
                        src="/images/logo 1.png"
                        alt="SmartShield"
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-gray-100">
                      Security Assessment
                    </h2>
                  </div>
                  <p className="text-base text-gray-500 font-medium">
                    Detailed URL Analysis & Risk Report
                  </p>
                </div>
                <motion.button
                  onClick={closeFeedbackModal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-4 p-2 hover:bg-gray-900 rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-700"
                  aria-label="Close modal"
                  title="Close (Esc)"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </motion.button>
              </motion.div>

              {/* Main Content - Scrollable */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="max-h-[75vh] overflow-y-auto scroll-smooth"
              >
                <div className="p-8 space-y-6 relative z-10">
                  {/* Primary Info Section - URL Card (Hero) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all shadow-lg">
                      <div className="flex items-start gap-4 mb-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            delay: 0.3,
                          }}
                          className="flex-shrink-0 p-2.5 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-gray-100"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          </svg>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                            Scanned URL
                          </label>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="text-gray-200 font-mono text-base break-all leading-relaxed bg-black/50 rounded-lg px-4 py-3 border border-gray-800"
                          >
                            {selectedFeedback.url}
                          </motion.p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={copySelectedUrl}
                              className="group relative inline-flex items-center gap-2 px-4 h-9 rounded-full overflow-hidden bg-gradient-to-r from-[#545BFF]/20 to-[#4349CD]/20 hover:from-[#545BFF]/30 hover:to-[#4349CD]/30 border border-[#545BFF]/30 hover:border-[#545BFF]/50 text-xs font-medium text-gray-200 transition-all duration-300"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <IconCopy className="w-4 h-4" />
                                {copiedUrl ? "Copied" : "Copy URL"}
                              </span>
                            </button>
                            <a
                              href={selectedFeedback.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative inline-flex items-center gap-2 px-4 h-9 rounded-full overflow-hidden border border-[#545BFF]/30 bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 hover:border-[#545BFF]/50 text-xs font-medium text-gray-200 transition-all duration-300"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <IconExternalLink className="w-4 h-4" />
                                Open
                              </span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Stats Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {/* Scan Date Card */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-gray-900/70 rounded-xl p-5 border border-gray-800/80 hover:border-gray-700 transition-all shadow-lg"
                    >
                      <div className="flex flex-col items-center">
                        <label className="text-xs font-semibold text-gray-400 tracking-wide mb-3 inline-flex items-center gap-2">
                          <IconCalendar className="w-5 h-5" />
                          Date
                        </label>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.35 }}
                          className="text-gray-100 font-semibold text-base leading-tight text-center"
                        >
                          {selectedFeedback.date.split(",")[0]}
                        </motion.p>
                        <p className="text-gray-500 text-sm mt-2 text-center">
                          {selectedFeedback.date.split(",").slice(1).join(",")}
                        </p>
                      </div>
                    </motion.div>

                    {/* Risk Level Card */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-gray-900/70 rounded-xl p-5 border border-gray-800/80 hover:border-gray-700 transition-all shadow-lg"
                    >
                      <div className="flex flex-col items-center">
                        <label className="text-xs font-semibold text-gray-400 tracking-wide mb-3 inline-flex items-center gap-2">
                          {selectedFeedback.risk === "Phishing" ? (
                            <IconAlertTriangle className="w-5 h-5" />
                          ) : selectedFeedback.risk === "Suspicious" ? (
                            <IconExclamationCircle className="w-5 h-5" />
                          ) : (
                            <IconCheckCircle className="w-5 h-5" />
                          )}
                          Risk Level
                        </label>
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: 0.35,
                            type: "spring",
                            stiffness: 150,
                          }}
                          className="flex justify-center"
                        >
                          <span
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-100 border ${
                              selectedFeedback.risk === "Phishing"
                                ? "bg-red-950/40 border-red-500/30"
                                : selectedFeedback.risk === "Suspicious"
                                  ? "bg-yellow-950/35 border-yellow-500/30"
                                  : "bg-green-950/30 border-green-500/25"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                selectedFeedback.risk === "Phishing"
                                  ? "bg-red-500"
                                  : selectedFeedback.risk === "Suspicious"
                                    ? "bg-yellow-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{
                                animation: "indicatorPulse 2s infinite",
                              }}
                            ></span>
                            {selectedFeedback.risk}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Community Reports Card */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-gray-900/70 rounded-xl p-5 border border-gray-800/80 hover:border-gray-700 transition-all shadow-lg"
                    >
                      <div className="flex flex-col items-center">
                        <label className="text-xs font-semibold text-gray-400 tracking-wide mb-3 inline-flex items-center gap-2">
                          <IconMessageCircle className="w-5 h-5" />
                          Reports
                        </label>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.35 }}
                          className="text-gray-100 font-bold text-2xl text-center tabular-nums"
                        >
                          {comments.length || "—"}
                        </motion.p>
                        <p className="text-gray-600 text-sm mt-2 text-center">
                          community flags
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Domain */}
                  {selectedFeedback.domain && (
                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 p-2.5 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-gray-100"
                          >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3 block">
                            🏢 Domain
                          </label>
                          <p className="text-gray-300 font-mono text-base bg-black/50 rounded-lg px-4 py-2.5 border border-gray-800 break-all">
                            {selectedFeedback.domain}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Score */}
                  {selectedFeedback.confidence != null && (
                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all shadow-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-shrink-0 p-2.5 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-gray-100"
                          >
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                              📊 Risk Score
                            </label>
                            <span
                              className={`text-sm font-bold px-4 py-2 rounded-lg ${
                                selectedFeedback.confidence >= 70
                                  ? "bg-red-950/60 text-gray-100"
                                  : selectedFeedback.confidence >= 40
                                    ? "bg-gray-700/60 text-gray-100"
                                    : "bg-gray-800/60 text-gray-100"
                              }`}
                            >
                              {selectedFeedback.confidence}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                selectedFeedback.confidence >= 70
                                  ? "bg-red-700"
                                  : selectedFeedback.confidence >= 40
                                    ? "bg-gray-600"
                                    : "bg-gray-700"
                              }`}
                              style={{
                                width: `${selectedFeedback.confidence}%`,
                              }}
                            />
                          </div>
                          <p
                            className={`text-sm mt-3 font-semibold ${
                              selectedFeedback.confidence >= 70
                                ? "text-red-400"
                                : selectedFeedback.confidence >= 40
                                  ? "text-gray-400"
                                  : "text-gray-500"
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {selectedFeedback.confidence >= 70 ? (
                                <IconAlertTriangle className="w-5 h-5" />
                              ) : selectedFeedback.confidence >= 40 ? (
                                <IconExclamationCircle className="w-5 h-5" />
                              ) : (
                                <IconCheckCircle className="w-5 h-5" />
                              )}
                              {selectedFeedback.confidence >= 70
                                ? "HIGH RISK - Phishing indicators detected"
                                : selectedFeedback.confidence >= 40
                                  ? "MEDIUM RISK - Suspicious activity"
                                  : "LOW RISK - Appears legitimate"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detection Services */}
                  {selectedFeedback.prediction?.detections?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-0.5">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1.5 h-5 bg-gray-200 rounded-full flex-shrink-0"
                          style={{ animation: "indicatorPulse 2s infinite" }}
                        ></motion.div>
                        <h3 className="text-gray-100 font-semibold text-base">
                          Detection Results
                        </h3>
                        <span className="ml-auto text-xs bg-gray-800/60 text-gray-500 px-3 py-1.5 rounded-full border border-gray-700/50 font-semibold">
                          {
                            selectedFeedback.prediction.detections.filter(
                              (d: any) =>
                                d.category === "phishing" ||
                                d.category === "malicious",
                            ).length
                          }{" "}
                          / {selectedFeedback.prediction.detections.length}{" "}
                          flagged
                        </span>
                      </div>
                      <div className="bg-gray-900/20 rounded-xl p-4 border border-gray-800 space-y-2 shadow-lg">
                        {selectedFeedback.prediction.detections
                          .slice(0, 8)
                          .map((det: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-black/40 rounded-lg px-4 py-3 text-sm border border-gray-800 hover:border-gray-700 transition-colors"
                            >
                              <span className="text-gray-500 truncate max-w-[60%] font-semibold">
                                {det.service}
                              </span>
                              <span
                                className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap ml-2 ${
                                  det.category === "phishing" ||
                                  det.category === "malicious"
                                    ? "bg-red-950/60 text-gray-100"
                                    : det.category === "suspicious"
                                      ? "bg-gray-700/60 text-gray-100"
                                      : "bg-gray-800/60 text-gray-100"
                                }`}
                              >
                                {det.result || det.category || "clean"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Indicators*/}
                  {selectedFeedback.prediction?.risk_adjustment?.indicators
                    ?.length > 0 && (
                    <div className="space-y-3">
                      {(() => {
                        const highConfidence =
                          selectedFeedback.confidence >= 70;

                        const indicatorStrings = (
                          selectedFeedback.prediction?.risk_adjustment
                            ?.indicators ?? []
                        ).filter(
                          (v: unknown) => typeof v === "string",
                        ) as string[];

                        const emojiStripRegex = /[\u{1F6A8}\u{26A0}\u{2705}]/gu; // 🚨 ⚠️ ✅

                        type IndicatorSeverity =
                          | "critical"
                          | "warning"
                          | "safe"
                          | "info";

                        const parseIndicator = (
                          raw: string,
                        ): {
                          severity: IndicatorSeverity;
                          text: string;
                        } => {
                          const hasCritical =
                            raw.includes("CRITICAL") || raw.includes("🚨");

                          const hasSafe =
                            raw.includes("✅") ||
                            /\b(legitimate|safe|benign|trusted|positive)\b/i.test(
                              raw,
                            );

                          const hasWarning =
                            raw.includes("⚠️") ||
                            /\b(suspicious|untrusted|unusual|warning|risk factor|very new|new domain|whois|tld)\b/i.test(
                              raw,
                            );

                          const severity: IndicatorSeverity = hasCritical
                            ? "critical"
                            : hasSafe
                              ? "safe"
                              : hasWarning
                                ? "warning"
                                : "warning";

                          const cleaned = raw
                            .replace(emojiStripRegex, "")
                            .replace(/\bCRITICAL\b/gi, "")
                            .replace(/^\s*[•]\s*/g, "")
                            .replace(/^\s*[-–—]\s*/g, "")
                            .replace(/\s+/g, " ")
                            .trim();

                          return { severity, text: cleaned };
                        };

                        const parsedIndicators =
                          indicatorStrings.map(parseIndicator);

                        const hasCritical = parsedIndicators.some(
                          (i) => i.severity === "critical",
                        );
                        const hasWarning = parsedIndicators.some(
                          (i) => i.severity === "warning",
                        );

                        const scanSeverityFromRisk: IndicatorSeverity =
                          selectedFeedback.risk === "Phishing"
                            ? "critical"
                            : selectedFeedback.risk === "Legitimate"
                              ? "safe"
                              : "warning";

                        // Keep UI consistent with the scan result (verdict).
                        // Indicators may contain "warning-ish" text even on safe verdicts.
                        const viewSeverity: IndicatorSeverity =
                          scanSeverityFromRisk;

                        const severityContainerConfig: Record<
                          Exclude<IndicatorSeverity, "info">,
                          {
                            bgClass: string;
                            borderClass: string;
                            textColor: string;
                            accentColor: string;
                            title: string;
                          }
                        > = {
                          critical: {
                            bgClass: "bg-red-950/20",
                            borderClass: "border-red-500/30",
                            textColor: "text-red-200",
                            accentColor: "text-red-400",
                            title: "Phishing Indicators Detected",
                          },
                          warning: {
                            bgClass: "bg-yellow-950/20",
                            borderClass: "border-yellow-500/30",
                            textColor: "text-yellow-100",
                            accentColor: "text-yellow-400",
                            title: "Suspicious Factors Identified",
                          },
                          safe: {
                            bgClass: "bg-green-950/20",
                            borderClass: "border-green-500/30",
                            textColor: "text-green-100",
                            accentColor: "text-green-400",
                            title: "Safety Indicators Confirmed",
                          },
                        };

                        const severityItemConfig: Record<
                          IndicatorSeverity,
                          {
                            itemBgClass: string;
                            itemBorderClass: string;
                            textColor: string;
                            accentColor: string;
                          }
                        > = {
                          critical: {
                            itemBgClass: "bg-red-950/30",
                            itemBorderClass: "border-red-500/30",
                            textColor: "text-red-200",
                            accentColor: "text-red-400",
                          },
                          warning: {
                            itemBgClass: "bg-yellow-950/30",
                            itemBorderClass: "border-yellow-500/30",
                            textColor: "text-yellow-100",
                            accentColor: "text-yellow-400",
                          },
                          safe: {
                            itemBgClass: "bg-green-950/30",
                            itemBorderClass: "border-green-500/30",
                            textColor: "text-green-100",
                            accentColor: "text-green-400",
                          },
                          info: {
                            itemBgClass: "bg-gray-900/30",
                            itemBorderClass: "border-gray-700/50",
                            textColor: "text-gray-200",
                            accentColor: "text-gray-300",
                          },
                        };

                        const containerConfig =
                          severityContainerConfig[viewSeverity];

                        const scanResultTitle =
                          selectedFeedback.risk === "Phishing"
                            ? "Phishing Indicators Detected"
                            : selectedFeedback.risk === "Legitimate"
                              ? "Safe Indicators Confirmed"
                              : "Suspicious Factors Identified";

                        const ViewHeaderIcon =
                          viewSeverity === "critical"
                            ? IconAlertTriangle
                            : viewSeverity === "warning"
                              ? IconExclamationCircle
                              : IconCheckCircle;

                        const viewHeaderDotClass =
                          viewSeverity === "critical"
                            ? "bg-red-500"
                            : viewSeverity === "warning"
                              ? "bg-yellow-500"
                              : "bg-green-500";

                        return (
                          <>
                            <div className="flex items-center gap-3 px-0.5">
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{
                                  duration: highConfidence ? 1.5 : 2,
                                  repeat: Infinity,
                                }}
                                className={`w-1.5 h-5 rounded-full flex-shrink-0 ${
                                  viewHeaderDotClass
                                }`}
                                style={{
                                  animation: "indicatorPulse 2s infinite",
                                }}
                              ></motion.div>
                              <h3
                                className={`font-semibold text-base ${containerConfig.textColor}`}
                              >
                                <ViewHeaderIcon className="w-5 h-5 inline-block -mt-0.5 mr-1" />
                                {scanResultTitle}
                              </h3>
                            </div>

                            <div
                              className={`${containerConfig.bgClass} rounded-xl p-5 border ${containerConfig.borderClass} space-y-3 shadow-lg`}
                            >
                              {parsedIndicators.map((indicator, i) => {
                                const effectiveSeverity: IndicatorSeverity =
                                  // Keep row styling consistent with the scan verdict:
                                  // - Safe verdict: allow safe + neutral info only
                                  // - Suspicious verdict: allow safe + warning only (no critical/red)
                                  // - Phishing verdict: everything is critical/red
                                  scanSeverityFromRisk === "critical"
                                    ? "critical"
                                    : scanSeverityFromRisk === "warning"
                                      ? indicator.severity === "safe"
                                        ? "safe"
                                        : "warning"
                                      : indicator.severity === "safe"
                                        ? "safe"
                                        : "info";

                                const itemConfig =
                                  severityItemConfig[effectiveSeverity];
                                const ItemIcon =
                                  effectiveSeverity === "critical"
                                    ? IconAlertTriangle
                                    : effectiveSeverity === "warning"
                                      ? IconExclamationCircle
                                      : effectiveSeverity === "info"
                                        ? IconInfoCircle
                                        : IconCheckCircle;

                                return (
                                  <motion.div
                                    key={`${effectiveSeverity}-${i}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      delay: i * 0.05,
                                      duration: 0.3,
                                    }}
                                    className={`flex items-start gap-3 text-sm p-4 ${itemConfig.itemBgClass} rounded-lg border ${itemConfig.itemBorderClass} transition-all group hover:border-opacity-75`}
                                  >
                                    <span
                                      className={`flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform ${itemConfig.accentColor}`}
                                    >
                                      <ItemIcon className="w-6 h-6" />
                                    </span>
                                    <span
                                      className={`leading-relaxed font-medium ${itemConfig.textColor}`}
                                    >
                                      {indicator.text}
                                    </span>
                                  </motion.div>
                                );
                              })}

                              {/* Summary Footer */}
                              <div
                                className={`mt-4 pt-4 border-t ${containerConfig.borderClass} flex items-start gap-3`}
                              >
                                <div className="text-xs space-y-1.5 flex-1">
                                  {viewSeverity === "critical" && (
                                    <>
                                      <p className="text-red-300 font-semibold inline-flex items-center gap-2">
                                        <IconAlertTriangle className="w-5 h-5" />
                                        This URL exhibits phishing
                                        characteristics
                                      </p>
                                      <p className={`text-red-200/70`}>
                                        Multiple security indicators suggest
                                        this is a malicious site designed to
                                        deceive users.
                                      </p>
                                    </>
                                  )}
                                  {viewSeverity === "warning" && (
                                    <>
                                      <p className="text-yellow-300 font-semibold inline-flex items-center gap-2">
                                        <IconExclamationCircle className="w-5 h-5" />
                                        This URL has suspicious characteristics
                                      </p>
                                      <p className={`text-yellow-200/70`}>
                                        Some security factors are concerning,
                                        but additional verification recommended.
                                      </p>
                                    </>
                                  )}
                                  {viewSeverity === "safe" && (
                                    <>
                                      <p className="text-green-300 font-semibold inline-flex items-center gap-2">
                                        <IconCheckCircle className="w-5 h-5" />
                                        This URL appears to be safe
                                      </p>
                                      <p className={`text-green-200/70`}>
                                        Security checks completed successfully.
                                        No major threats detected.
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* SSL / WHOIS */}
                  {(selectedFeedback.prediction?.ssl ||
                    selectedFeedback.prediction?.whois) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-0.5">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1.5 h-5 bg-gray-200 rounded-full flex-shrink-0"
                          style={{ animation: "indicatorPulse 2s infinite" }}
                        ></motion.div>
                        <h3 className="text-gray-100 font-semibold text-base">
                          Verification Details
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedFeedback.prediction?.ssl?.valid !==
                          undefined && (
                          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="text-gray-100"
                                >
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                              </div>
                              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                                SSL Certificate
                              </label>
                            </div>
                            <span
                              className={`text-sm font-bold inline-block px-4 py-2 rounded-lg ${
                                selectedFeedback.prediction.ssl.valid
                                  ? "bg-gray-800/60 text-gray-100"
                                  : "bg-red-950/60 text-gray-100"
                              }`}
                            >
                              {selectedFeedback.prediction.ssl.valid
                                ? "✓ Valid"
                                : "✗ Invalid"}
                            </span>
                          </div>
                        )}
                        {selectedFeedback.prediction?.whois?.creation_date && (
                          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="text-gray-100"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              </div>
                              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                                Domain Age
                              </label>
                            </div>
                            <p className="text-gray-200 font-semibold text-base bg-black rounded-lg px-4 py-2 border border-gray-800">
                              {selectedFeedback.prediction.whois.creation_date}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Community Reports */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-0.5">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-5 bg-gray-200 rounded-full flex-shrink-0"
                        style={{ animation: "indicatorPulse 2s infinite" }}
                      ></motion.div>
                      <h3 className="text-gray-100 font-bold text-base">
                        Community Reports
                      </h3>
                      <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/30 text-gray-400 text-xs font-bold rounded-lg border border-gray-800 shadow-md">
                        <span className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-2 w-2 rounded-full bg-gray-200 animate-pulse"></span>
                          <span className="inline-flex h-2 w-2 rounded-full bg-gray-200 opacity-75"></span>
                        </span>
                        {commentsLoading
                          ? "Loading..."
                          : `${comments.length} report${comments.length !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div className="bg-black rounded-xl p-4 border border-gray-800 shadow-lg">
                      <div className="space-y-2.5 max-h-40 overflow-y-auto">
                        {commentsLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="text-center">
                              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-gray-600 mb-2"></div>
                              <p className="text-gray-400 text-xs font-medium">
                                Loading reports...
                              </p>
                            </div>
                          </div>
                        ) : comments.length > 0 ? (
                          comments.map((c: any) => (
                            <div
                              key={c.id}
                              className="bg-gray-950 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all group shadow-md"
                            >
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="text-gray-300 text-base font-bold group-hover:text-gray-100 transition-colors duration-200">
                                  {c.author}
                                </p>
                                <span
                                  className={`text-xs px-3 py-1.5 rounded-md font-bold whitespace-nowrap text-gray-100 shadow-md ${
                                    c.flag === "phishing"
                                      ? "bg-red-950/60"
                                      : c.flag === "legitimate"
                                        ? "bg-gray-800/60"
                                        : "bg-gray-700/60"
                                  }`}
                                >
                                  {c.flag?.charAt(0).toUpperCase() +
                                    c.flag?.slice(1) || "Neutral"}
                                </span>
                              </div>
                              {c.url && (
                                <p className="text-gray-400 text-xs font-mono break-all mb-2 bg-black rounded px-3 py-1.5 border border-gray-800">
                                  {c.url}
                                </p>
                              )}
                              <p className="text-gray-300 text-base mb-2 leading-relaxed font-medium">
                                {c.comment}
                              </p>
                              <p className="text-gray-500 text-sm">{c.date}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-base font-medium">
                              No community reports at this time
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              {/* Footer */}
              <div className="relative z-10 border-t border-gray-800 bg-black px-8 py-6 flex items-center justify-between gap-4 rounded-b-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-100 animate-pulse shadow-lg shadow-gray-100/30"></div>
                    <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
                      SCAN REPORT
                    </span>
                  </div>
                  <span className="text-base text-gray-500 font-medium">
                    {selectedFeedback.date}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-7 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-950 font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-gray-100/20 active:scale-95 text-base uppercase tracking-wide"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative bg-gray-950 border-t border-gray-800 py-8 px-6 transition-colors overflow-hidden mt-16">
        {/* Aurora Background Effect */}
        <div className="absolute bottom-0 left-0 w-full h-[500px] pointer-events-none z-0">
          <div className="w-full h-full opacity-100 [mask-image:linear-gradient(to_top,black_40%,transparent_100%)]">
            <Aurora
              colorStops={["#6B73FF", "#b19eef", "#6B73FF"]}
              amplitude={1.2}
              blend={0.6}
              speed={0.5}
            />
          </div>
        </div>

        {/* Footer Content */}
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3">
            {/* Logo and name */}
            <div className="relative w-8 h-8">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span className="text-gray-100 text-lg font-semibold transition-colors">
              SmartShield
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
