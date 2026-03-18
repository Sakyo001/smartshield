"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@lib/supabase";
import { motion, useInView } from "motion/react";
import Link from "next/link";

interface RecentScan {
  id: string;
  url: string;
  decision: "safe" | "warning" | "dangerous";
  created_at: string;
}

const getStatusColor = (decision: string) => {
  switch (decision) {
    case "safe":
      return {
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
        label: "Safe",
      };
    case "warning":
      return {
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
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
        badge: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
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

const truncateUrl = (url: string, maxLength: number = 50) => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
};

export default function RecentScans() {
  const [scans, setScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  useEffect(() => {
    const fetchRecentScans = async () => {
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
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error && data) {
          setScans(data as RecentScan[]);
        }
      } catch (err) {
        console.error("Error fetching recent scans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentScans();
  }, []);

  if (loading) {
    return (
      <section ref={sectionRef} className="py-8 md:py-10 px-4 sm:px-6 bg-page relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#545BFF]/10 rounded-xl border border-[#545BFF]/15"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (scans.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-8 md:py-10 px-4 sm:px-6 bg-page relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[5%] left-[8%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#545BFF]/8 blur-[100px]" />
        <div className="absolute bottom-[5%] right-[8%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#b19eef]/6 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm shadow-sm dark:shadow-none mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
            <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
              Your Activity
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight leading-[1.1] mb-2"
          >
            Recent Scans
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-copy/80 text-sm md:text-base max-w-2xl leading-relaxed"
          >
            Your 5 most recent URL scans and their threat assessment results.
          </motion.p>
        </div>

        {/* Scans list */}
        <div className="space-y-3">
          {scans.map((scan, index) => {
            const colors = getStatusColor(scan.decision);
            return (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.4 + index * 0.08 }}
                className="group relative rounded-2xl transition-all duration-300
                  dark:bg-[#0a0b14]/50 bg-white/50 backdrop-blur-xl
                  shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)]
                  hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(84,91,255,0.12)] hover:dark:shadow-[0_8px_30px_rgba(84,91,255,0.08)]"
              >
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-b from-white/40 to-white/10 dark:from-white/10 dark:to-transparent pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 p-px bg-gradient-to-r from-[#545BFF]/50 to-[#6B73FF]/50 transition-opacity duration-300 pointer-events-none" />

                <div className="relative p-4 sm:p-5 flex items-center justify-between gap-3">
                  {/* Left: URL and status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.badge}`}>
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
                  <div className="shrink-0 text-right">
                    <p className="text-faded text-xs sm:text-sm font-medium whitespace-nowrap">
                      {formatDate(scan.created_at)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load more link */}
        {scans.length >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.8 }}
            className="mt-6 text-center"
          >
            <Link
              href="/dashboard/scans"
              className="inline-flex items-center gap-2 text-[#545BFF] dark:text-[#7c83ff] hover:text-[#6B73FF] dark:hover:text-[#8b93ff] font-semibold text-sm transition-colors"
            >
              View all scans
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
