"use client";

import { createClient } from "@lib/supabase";
import { AnimatePresence, motion, useInView } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Scan {
  id: string;
  url: string;
  decision: "safe" | "warning" | "dangerous";
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const getStatusColor = (decision: string) => {
  switch (decision) {
    case "safe":
      return {
        badge:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
        label: "Safe",
      };
    case "warning":
      return {
        badge:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
        label: "Suspicious",
      };
    case "dangerous":
      return {
        badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        dot: "bg-red-500",
        label: "Dangerous",
      };
    default:
      return {
        badge:
          "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        dot: "bg-gray-500",
        label: "Unknown",
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const truncateUrl = (url: string, maxLength: number = 60) => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
};

export default function AllScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "safe" | "warning" | "dangerous"
  >("all");
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  useEffect(() => {
    const fetchAllScans = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("extension_activity")
          .select("id, url, decision, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setScans(data as Scan[]);
        }
      } catch (err) {
        console.error("Error fetching scans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllScans();
  }, []);

  // Filter scans
  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.url
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || scan.decision === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedScans = filteredScans.slice(startIndex, endIndex);

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPagination();
  };

  const handleFilterChange = (status: typeof filterStatus) => {
    setFilterStatus(status);
    resetPagination();
  };

  if (loading) {
    return (
      <div className="py-8 md:py-10 px-4 sm:px-6 bg-page relative overflow-hidden min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#545BFF]/10 rounded-xl border border-[#545BFF]/15"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="py-8 md:py-10 px-4 sm:px-6 bg-page relative overflow-hidden min-h-screen"
    >
      {/* Ambient glows */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div className="absolute top-[5%] left-[8%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#545BFF]/8 blur-[100px]" />
        <div className="absolute bottom-[5%] right-[8%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#b19eef]/6 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-3">
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center gap-2 px-5 h-10 rounded-full overflow-hidden border border-[#545BFF]/30 bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 text-heading text-sm font-semibold hover:border-[#545BFF]/50 hover:-translate-y-0.5 transition-all duration-300 mb-3"
          >
            <svg
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm shadow-sm dark:shadow-none mb-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
                  Complete History
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-3xl sm:text-4xl font-extrabold text-heading tracking-tight leading-[1.1] mb-2"
              >
                All Scans
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-copy/80 text-sm md:text-base max-w-xl leading-relaxed"
              >
                View and manage all your URL scans. {filteredScans.length} total{" "}
                {filteredScans.length === 1 ? "scan" : "scans"}
                {searchTerm && ` matching "${searchTerm}"`}
              </motion.p>
            </div>

            {/* Status filters */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap sm:justify-end gap-2 shrink-0"
            >
              {["all", "safe", "warning", "dangerous"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    handleFilterChange(status as typeof filterStatus)
                  }
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 border ${
                    filterStatus === status
                      ? "bg-gradient-to-r from-[#545BFF] to-[#6B73FF] text-white border-transparent shadow-md shadow-[#545BFF]/25"
                      : "dark:bg-white/[0.03] bg-black/5 border-transparent text-faded hover:text-heading hover:bg-black/10 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#545BFF]/0 via-[#545BFF]/10 to-[#545BFF]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
            <div className="relative flex items-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-4 text-faded/50 pointer-events-none group-focus-within:text-[#545BFF] transition-colors duration-300"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search for a URL..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-none
                  dark:bg-[#0d0e1a]/80 bg-white/90 backdrop-blur-xl
                  text-heading placeholder:text-faded/40
                  shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                  focus:outline-none focus:ring-2 focus:ring-[#545BFF]/40
                  transition-all duration-300 font-medium"
              />
            </div>
          </div>
        </motion.div>

        {/* Scans list */}
        {paginatedScans.length > 0 ? (
          <>
            <div className="space-y-3 mb-8">
              <AnimatePresence mode="popLayout">
                {paginatedScans.map((scan, index) => {
                  const colors = getStatusColor(scan.decision);
                  return (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative rounded-2xl transition-all duration-300
                        dark:bg-[#0a0b14]/50 bg-white/50 backdrop-blur-xl
                        border-none shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)]
                        hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(84,91,255,0.12)] hover:dark:shadow-[0_8px_30px_rgba(84,91,255,0.08)]"
                    >
                      {/* Gradient border effect */}
                      <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-b from-white/40 to-white/10 dark:from-white/10 dark:to-transparent pointer-events-none" />
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 p-[1px] bg-gradient-to-r from-[#545BFF]/50 to-[#6B73FF]/50 transition-opacity duration-300 pointer-events-none" />

                      <div className="relative p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Left: URL and status */}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${colors.dot}`}
                            />
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.badge}`}
                            >
                              {colors.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0 text-[#545BFF] dark:text-[#a89de8] opacity-60"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <a
                              href={scan.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={scan.url}
                              className="text-heading text-sm sm:text-base font-medium hover:text-[#545BFF] transition-colors truncate"
                            >
                              {truncateUrl(scan.url)}
                            </a>
                          </div>
                        </div>

                        {/* Right: Date */}
                        <div className="shrink-0 text-right sm:text-left">
                          <p className="text-faded text-xs sm:text-sm font-medium">
                            {formatDate(scan.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-center justify-between gap-4 pt-6 border-t border-[#545BFF]/10"
              >
                <div className="text-sm text-faded">
                  Page {currentPage} of {totalPages} ({filteredScans.length}{" "}
                  total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-[#545BFF]/20
                      text-copy hover:text-heading hover:border-[#545BFF]/40 hover:bg-[#545BFF]/6
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300 font-medium text-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-[#545BFF]/20
                      text-copy hover:text-heading hover:border-[#545BFF]/40 hover:bg-[#545BFF]/6
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300 font-medium text-sm"
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-[#545BFF]/10 flex items-center justify-center mx-auto mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#545BFF]/50"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-heading mb-2">
              No scans found
            </h3>
            <p className="text-faded text-sm max-w-xs mx-auto">
              {searchTerm
                ? `No scans match "${searchTerm}"`
                : "You haven't scanned any URLs yet. Start by scanning a URL in the scanner above."}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
