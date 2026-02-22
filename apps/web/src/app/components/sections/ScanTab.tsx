"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@lib/auth-context";
import { getTodaysScans } from "@lib/supabase";
import Link from "next/link";

interface ScanResult {
  url: string;
  riskScore: number;
  status: "Safe" | "Warning" | "Dangerous";
  date: string;
}

export default function ScanTab() {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getTodaysScans(user.id)
        .then((scans) => {
          setRecentScans(scans);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching scans:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0f0f1e] rounded-2xl p-12 text-center shadow-lg border border-gray-800">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-[#6B73FF]/10 flex items-center justify-center mx-auto mb-4">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B73FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Sign in to view your scans
            </h3>
            <p className="text-gray-400 mb-6">
              Create an account or sign in to track your URL scans and protect yourself from phishing attacks.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-[#6B73FF] hover:bg-[#5a62ff] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#6B73FF]/30"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-[#1a1a2e] hover:bg-[#212136] text-[#6B73FF] border border-[#6B73FF] px-8 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0f0f1e] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#6B73FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your scans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Your Recent Scans
        </h2>
        <p className="text-gray-400">
          Track your URL scanning history and security analysis results
        </p>
      </div>

      {recentScans.length > 0 ? (
        <div className="bg-[#0f0f1e] rounded-2xl overflow-hidden shadow-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0a0a0f]">
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                    URL / Domain
                  </th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                    Risk Analysis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentScans.slice(0, 10).map((scan, index) => (
                  <tr
                    key={index}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-gray-100 text-sm">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            scan.status === "Dangerous"
                              ? "bg-red-500"
                              : scan.status === "Warning"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <span className="break-all max-w-[400px]">{scan.url}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                      {scan.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-gray-400 text-sm font-mono">
                          {scan.riskScore}%
                        </span>
                        <span
                          className={`${
                            scan.status === "Dangerous"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : scan.status === "Warning"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          } text-xs px-3 py-1 rounded-full border font-medium uppercase tracking-wide`}
                        >
                          {scan.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f0f1e] rounded-2xl p-16 text-center shadow-lg border border-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No scans yet
          </h3>
          <p className="text-gray-400 mb-6">
            Start protecting yourself by scanning your first URL
          </p>
          <Link
            href={`/dashboard/${user.id}`}
            className="inline-block bg-[#6B73FF] hover:bg-[#5a62ff] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#6B73FF]/30"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
