"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@lib/supabase";
import Aurora from "@components/ui/Aurora";

function normalizeDecision(decision: unknown): "dangerous" | "warning" | "safe" {
  if (decision === "dangerous" || decision === "warning" || decision === "safe") return decision;
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
  const risk = d === "dangerous" ? "Phishing" : d === "safe" ? "Legitimate" : "Suspicious";

  return {
    id: report?.id,
    createdAt,
    date: new Date(createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    url: typeof report?.url === "string" && report.url.length > 0 ? report.url : "(unknown URL)",
    domain: report?.domain || "",
    confidence: report?.confidence ?? null,
    decision: decision || "",
    prediction: report?.prediction || null,
    risk,
    feedback: true,
  };
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const activeUserIdsRef = useRef<Set<string>>(new Set());
  const processedRealtimeScanIdsRef = useRef<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scanData, setScanData] = useState<any[]>([]);
  const [stats, setStats] = useState({ phishing: 0, suspicious: 0, legitimate: 0 });
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [dailyScanData, setDailyScanData] = useState<{ [key: string]: number }>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
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
      console.error("Error fetching recent scan activity:", error.message || JSON.stringify(error));
      return;
    }

    if (reports && reports.length > 0) {
      const formattedData = reports.map((report: any) => formatActivityRow(report));
      formattedData.sort(
        (a: any, b: any) =>
          (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0)
      );
      setScanData(formattedData);
      return;
    }

    setScanData([]);
  };

  const fetchReports = async (supabase: any) => {
    try {
      await fetchRecentScanActivity(supabase);

      // Fetch all reports for stats calculation
      const { data: allReports, error: reportsError } = await supabase
        .from("extension_activity")
        .select("decision");

      if (reportsError) {
        console.error("Error fetching all reports:", reportsError.message || JSON.stringify(reportsError));
        return;
      }

      if (allReports) {
        const phishingCount = allReports.filter((r: any) => normalizeDecision(r.decision) === "dangerous").length;
        const legitimateCount = allReports.filter((r: any) => normalizeDecision(r.decision) === "safe").length;
        const suspiciousCount = allReports.filter((r: any) => normalizeDecision(r.decision) === "warning").length;

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
        console.error("Error fetching users:", usersError.message || JSON.stringify(usersError));
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
          console.error("Error fetching recent scans:", scansError.message || JSON.stringify(scansError));
          return;
        }

        if (recentScans) {
          // Count unique users from last 7 days
            const uniqueUsers = new Set<string>(
              recentScans
                .map((scan: any) => scan.user_id)
                .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
            );
          activeUserIdsRef.current = uniqueUsers;
          setActiveUsers(uniqueUsers.size);

          // Calculate daily scan counts for last 7 days
          const dailyData = createLast7DaysTemplate();

          recentScans.forEach((scan: any) => {
            const dateStr = getDayKey(scan.created_at);
            if (dateStr && Object.prototype.hasOwnProperty.call(dailyData, dateStr)) {
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
                return [row, ...prev].slice(0, 10);
              });

              const decision = normalizeDecision(payload?.new?.decision);
              setStats((prev) => ({
                phishing: prev.phishing + (decision === "dangerous" ? 1 : 0),
                suspicious: prev.suspicious + (decision === "warning" ? 1 : 0),
                legitimate: prev.legitimate + (decision === "safe" ? 1 : 0),
              }));
              setTotalScans((prev) => prev + 1);

              const createdAtValue =
                typeof payload?.new?.created_at === "string" && payload.new.created_at.length > 0
                  ? payload.new.created_at
                  : new Date();
              const dateKey = getDayKey(createdAtValue);
              setDailyScanData((prev) => {
                const next = Object.keys(prev).length > 0 ? { ...prev } : createLast7DaysTemplate();
                if (dateKey && Object.prototype.hasOwnProperty.call(next, dateKey)) {
                  next[dateKey] = (next[dateKey] ?? 0) + 1;
                }
                return next;
              });

              const userId = payload?.new?.user_id;
              if (typeof userId === "string" && userId.length > 0 && !activeUserIdsRef.current.has(userId)) {
                activeUserIdsRef.current.add(userId);
                setActiveUsers(activeUserIdsRef.current.size);
              }
            }

            scheduleRecentSync();
            scheduleSync();
          } catch (err) {
            console.error("Realtime extension_activity insert handling failed:", err);
          }
        }
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
        }
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
  }, [isAuthenticated, loading]);

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
      
      // First, try to fetch reports with user data
      const { data: reports, error } = await supabase
        .from("reports")
        .select("id, description, flag, created_at, user_id")
        .eq("url", url)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports - Full error object:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setComments([]);
        return;
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

      const userMap = new Map(users?.map((u: any) => [u.id, { email: u.email, display_name: u.display_name }]) || []);

      // Format comments with user data
      const formattedComments = reports.map((r: any) => {
        const user = userMap.get(r.user_id) || { email: "Unknown", display_name: "Anonymous" };
        return {
          id: r.id,
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
    await fetchComments(item.url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-black text-gray-100">
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
          background: #6B73FF;
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

      {/* Navbar with Aurora */}
      <nav className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-gray-900/90 dark:bg-gray-950/90 backdrop-blur-md shadow-sm border-b border-gray-800/50"
          : "bg-transparent border-transparent"
      }`}>
        <div className={`absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300 ${
          isScrolled ? "opacity-20" : "opacity-0"
        }`}>
          <Aurora
            colorStops={["#6B73FF", "#b19eef", "#6B73FF"]}
            amplitude={1.2}
            blend={0.5}
          />
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-10">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
            <div className="relative w-20 h-20 shrink-0">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield Logo"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-white text-lg md:text-xl font-bold tracking-wide">
                SmartShield
              </span>
              <span className="font-medium text-[#6B73FF] tracking-wide text-[10px] md:text-xs">
                Admin Dashboard
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
            {["Dashboard", "URLs", "Settings"].map((item) => (
              <Link
                key={item}
                href={item === "URLs" ? "/admin/urls" : `#${item.toLowerCase()}`}
                className="nav-link text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400 hidden sm:block">
              Admin: <span className="text-white font-medium">{adminEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="logout-button px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gradient-to-r from-[#6B73FF]/20 to-[#5A62E8]/20 hover:from-[#6B73FF]/30 hover:to-[#5A62E8]/30 border border-[#6B73FF]/30 rounded-lg transition-all duration-300"
            >
              {logoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content pt-24 max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hello, Admin</h1>
          <p className="text-gray-400">
            Welcome to the SmartShield admin dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Scans",
              value: totalScans.toLocaleString(),
              sub: "All security scans",
              color: "text-white",
              subColor: "text-blue-400",
            },
            {
              label: "Threats Detected",
              value: stats.phishing.toLocaleString(),
              sub: "Phishing URLs blocked",
              color: "text-red-400",
              subColor: "text-red-400",
            },
            {
              label: "Active Users",
              value: activeUsers.toLocaleString(),
              sub: `of ${totalUsers.toLocaleString()} total users`,
              color: "text-blue-400",
              subColor: "text-blue-400",
            },
            {
              label: "Detection Accuracy",
              value: "97.7%",
              sub: "Phishing detection rate",
              color: "text-green-400",
              subColor: "text-green-400",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="stat-card bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 hover:border-[#6B73FF]/50 rounded-lg p-6 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className={`${stat.subColor} text-xs mt-2`}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 rounded-lg p-6 backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
            <h2 className="text-white font-semibold mb-4">
              Scan Activity (Last 7 Days)
            </h2>
            <div className="h-64 flex items-end justify-around gap-2 bg-gray-950/50 rounded p-4">
              {(() => {
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  dates.push(date);
                }

                const maxScans = Math.max(...dates.map((d) => dailyScanData[getDayKey(d)] || 0), 1);

                return dates.map((date, idx) => {
                  const dateStr = getDayKey(date);
                  const scans = dailyScanData[dateStr] || 0;
                  const heightPercent = maxScans > 0 ? (scans / maxScans) * 100 : 0;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className="w-full rounded bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 transition-all relative group"
                        style={{ height: `${heightPercent}px` || "20px" }}
                        title={`${dateStr}: ${scans} scans`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {scans} scans
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 rounded-lg p-6 backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
            <h2 className="text-white font-semibold mb-4">Total Scan</h2>
            <div className="flex flex-col items-center gap-4">
              {(() => {
                const total = stats.phishing + stats.suspicious + stats.legitimate;
                const phishingPercent = total > 0 ? (stats.phishing / total) * 100 : 0;
                const suspiciousPercent = total > 0 ? (stats.suspicious / total) * 100 : 0;
                const legitimatePercent = total > 0 ? (stats.legitimate / total) * 100 : 0;

                return (
                  <>
                    <div
                      className="w-40 h-40 rounded-full border-8 border-gray-800 flex items-center justify-center relative hover:scale-105 transition-transform duration-300"
                      style={{
                        background: `conic-gradient(#ef4444 0deg ${phishingPercent * 3.6}deg, #f97316 ${phishingPercent * 3.6}deg ${(phishingPercent + suspiciousPercent) * 3.6}deg, #22c55e ${(phishingPercent + suspiciousPercent) * 3.6}deg)`,
                      }}
                    >
                      <div className="w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center z-10">
                        <span className="text-xl font-bold text-white">{total > 0 ? ((stats.phishing / total) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 text-center space-y-1">
                      <div className="hover:text-white transition-colors">🔴 Phishing: {stats.phishing}</div>
                      <div className="hover:text-white transition-colors">🟠 Suspicious: {stats.suspicious}</div>
                      <div className="hover:text-white transition-colors">🟢 Legitimate: {stats.legitimate}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 rounded-lg overflow-hidden backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
          <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-transparent">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Recent Scan Activity</h2>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={
                    realtimeConnected
                      ? "px-2 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/20"
                      : "px-2 py-1 rounded-full bg-gray-500/10 text-gray-300 border border-gray-500/20"
                  }
                >
                  {realtimeConnected ? "Live" : "Offline"}
                </span>
                <span className="text-gray-400">Updates: {realtimeEvents}</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30 border-b border-gray-700/50">
                <tr>
                  {["Date", "URL", "Risk", "Feedback"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-300"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {scanData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-800/20 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300 group-hover:text-white transition-colors">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 truncate max-w-[200px] group-hover:text-white transition-colors">
                      {item.url}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium text-white ${getRiskColor(item.risk)} hover:scale-110 transition-transform`}
                      >
                        {item.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleFeedbackClick(item)}
                        className="p-2 bg-gradient-to-r from-[#6B73FF]/20 to-[#5A62E8]/20 hover:from-[#6B73FF]/40 hover:to-[#5A62E8]/40 border border-[#6B73FF]/30 rounded-lg transition-all duration-300 hover:scale-110"
                        title="View Comments"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#6B73FF]"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-lg p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Scan Details</h3>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">URL</p>
                  <p className="text-white font-mono text-sm break-all">{selectedFeedback.url}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white font-medium">{selectedFeedback.date}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Risk Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-xs font-medium text-white mt-2 ${getRiskColor(selectedFeedback.risk)}`}
                  >
                    {selectedFeedback.risk}
                  </span>
                </div>

                {/* Domain */}
                {selectedFeedback.domain && (
                  <div>
                    <p className="text-gray-400 text-sm">Domain</p>
                    <p className="text-white font-mono text-sm">{selectedFeedback.domain}</p>
                  </div>
                )}

                {/* Risk Score */}
                {selectedFeedback.confidence != null && (
                  <div>
                    <p className="text-gray-400 text-sm">Risk Score</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            selectedFeedback.confidence >= 70
                              ? "bg-red-500"
                              : selectedFeedback.confidence >= 40
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${selectedFeedback.confidence}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${
                        selectedFeedback.confidence >= 70 ? "text-red-400" :
                        selectedFeedback.confidence >= 40 ? "text-yellow-400" : "text-green-400"
                      }`}>{selectedFeedback.confidence}%</span>
                    </div>
                  </div>
                )}

                {/* Detection Services */}
                {selectedFeedback.prediction?.detections?.length > 0 && (
                  <div className="border-t border-gray-700/50 pt-4">
                    <p className="text-gray-400 text-sm mb-2">
                      Detection Services
                      <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        {selectedFeedback.prediction.detections.filter((d: any) =>
                          d.category === "phishing" || d.category === "malicious"
                        ).length} / {selectedFeedback.prediction.detections.length} flagged
                      </span>
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedFeedback.prediction.detections.slice(0, 8).map((det: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-gray-950/50 rounded px-3 py-1.5 text-xs">
                          <span className="text-gray-300 truncate max-w-[55%]">{det.service}</span>
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            det.category === "phishing" || det.category === "malicious"
                              ? "bg-red-500/20 text-red-400"
                              : det.category === "suspicious"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}>
                            {det.result || det.category || "clean"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Indicators */}
                {selectedFeedback.prediction?.risk_adjustment?.indicators?.length > 0 && (
                  <div className="border-t border-gray-700/50 pt-4">
                    <p className="text-gray-400 text-sm mb-2">Risk Indicators</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {selectedFeedback.prediction.risk_adjustment.indicators.map((flag: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={`mt-0.5 ${
                            flag.includes("CRITICAL") || flag.includes("🚨") ? "text-red-400" : "text-yellow-400"
                          }`}>▲</span>
                          <span className="text-gray-300">{flag.replace(/[🚨⚠️]/g, "").trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SSL / WHOIS brief */}
                {(selectedFeedback.prediction?.ssl || selectedFeedback.prediction?.whois) && (
                  <div className="border-t border-gray-700/50 pt-4 grid grid-cols-2 gap-3">
                    {selectedFeedback.prediction?.ssl?.valid !== undefined && (
                      <div>
                        <p className="text-gray-400 text-xs">SSL Certificate</p>
                        <span className={`text-xs font-medium ${
                          selectedFeedback.prediction.ssl.valid ? "text-green-400" : "text-red-400"
                        }`}>
                          {selectedFeedback.prediction.ssl.valid ? "✓ Valid" : "✗ Invalid / Missing"}
                        </span>
                      </div>
                    )}
                    {selectedFeedback.prediction?.whois?.creation_date && (
                      <div>
                        <p className="text-gray-400 text-xs">Domain Created</p>
                        <span className="text-xs text-gray-300">{selectedFeedback.prediction.whois.creation_date}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-700/50 pt-4 mt-4">
                  <p className="text-gray-400 text-sm mb-3">Community Reports</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {commentsLoading ? (
                      <p className="text-gray-500 text-sm">Loading reports...</p>
                    ) : comments.length > 0 ? (
                      comments.map((c: any) => (
                        <div key={c.id} className="bg-gray-950/50 rounded p-3 border border-gray-800/50">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-white text-sm font-medium">{c.author}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              c.flag === 'phishing' ? 'bg-red-500/20 text-red-400' :
                              c.flag === 'legitimate' ? 'bg-green-500/20 text-green-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {c.flag?.charAt(0).toUpperCase() + c.flag?.slice(1) || 'Neutral'}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-1">{c.comment}</p>
                          <p className="text-gray-500 text-xs">{c.date}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No community reports yet</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedFeedback(null)}
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-[#6B73FF]/20 to-[#5A62E8]/20 hover:from-[#6B73FF]/40 hover:to-[#5A62E8]/40 border border-[#6B73FF]/30 text-white rounded-lg transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative bg-gray-900/50 border-t border-gray-800/50 py-8 px-6 transition-colors overflow-hidden mt-16">
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
            <span className="text-white text-lg font-semibold transition-colors">
              SmartShield
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
