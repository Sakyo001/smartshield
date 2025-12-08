"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Aurora from "@components/ui/Aurora";
import ThemeToggle from "@components/ui/ThemeToggle";

export default function AdminDashboardClient() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Authentication Check
  useEffect(() => {
    const session = localStorage.getItem("adminSession");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.isAdmin) {
          setAdminEmail(data.email);
          setIsAuthenticated(true);
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        router.push("/admin/login");
      }
    } else {
      router.push("/admin/login");
    }
    setLoading(false);
  }, [router]);

  // Scroll effect listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    router.push("/admin/login");
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

  // Mock Data matching your reference
  const scanData = [
    {
      email: "user@example.com",
      date: "October 31, 2022",
      url: "http://example.com",
      risk: "Suspicious",
      feedback: true,
    },
    {
      email: "test@example.com",
      date: "February 11, 2023",
      url: "http://example.io",
      risk: "Infected",
      feedback: true,
    },
    {
      email: "admin@example.com",
      date: "May 11, 2023",
      url: "https://example-site.ai",
      risk: "Clean",
      feedback: true,
    },
    {
      email: "user@example.com",
      date: "December 11, 2023",
      url: "http://verification.com",
      risk: "Dangerous",
      feedback: true,
    },
    {
      email: "test@example.com",
      date: "March 15, 2023",
      url: "http://suspicious-site.net",
      risk: "Suspicious",
      feedback: true,
    },
    {
      email: "user@example.com",
      date: "April 01, 2023",
      url: "http://phishing-alert.org",
      risk: "Infected",
      feedback: true,
    },
    {
      email: "admin@example.com",
      date: "June 25, 2023",
      url: "http://secure-portal.io",
      risk: "Clean",
      feedback: true,
    },
    {
      email: "user@example.com",
      date: "July 14, 2023",
      url: "http://verify-account.us",
      risk: "Dangerous",
      feedback: true,
    },
    {
      email: "test@example.com",
      date: "August 19, 2023",
      url: "http://risky-deal.com",
      risk: "Suspicious",
      feedback: true,
    },
    {
      email: "admin@example.com",
      date: "November 18, 2023",
      url: "http://security-check.site",
      risk: "Clean",
      feedback: true,
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Dangerous":
        return "bg-red-500";
      case "Infected":
        return "bg-red-400";
      case "Suspicious":
        return "bg-yellow-500";
      case "Clean":
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
            {["Dashboard", "Analytics", "Users", "Settings"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="nav-link text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-gray-400 hidden sm:block">
              Admin: <span className="text-white font-medium">{adminEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-button px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gradient-to-r from-[#6B73FF]/20 to-[#5A62E8]/20 hover:from-[#6B73FF]/30 hover:to-[#5A62E8]/30 border border-[#6B73FF]/30 rounded-lg transition-all duration-300"
            >
              Logout
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
              value: "12,543",
              sub: "+2.5% from last month",
              color: "text-white",
              subColor: "text-green-400",
            },
            {
              label: "Threats Detected",
              value: "342",
              sub: "Blocked malicious URLs",
              color: "text-red-400",
              subColor: "text-red-400",
            },
            {
              label: "Users Protected",
              value: "1,234",
              sub: "Active users",
              color: "text-blue-400",
              subColor: "text-blue-400",
            },
            {
              label: "Detection Rate",
              value: "98.7%",
              sub: "Accuracy improved",
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
              {[60, 45, 75, 90, 55, 70, 85].map((height, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 rounded bg-gradient-to-t from-blue-600 to-blue-400"
                    style={{ height: `${height}px` }}
                  ></div>
                  <span className="text-xs text-gray-400">{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 rounded-lg p-6 backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
            <h2 className="text-white font-semibold mb-4">Total Scan</h2>
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-40 h-40 rounded-full border-8 border-gray-800 flex items-center justify-center relative hover:scale-105 transition-transform duration-300"
                style={{
                  background:
                    "conic-gradient(#ef4444 0deg 120deg, #f97316 120deg 240deg, #22c55e 240deg)",
                }}
              >
                <div className="w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center z-10">
                  <span className="text-xl font-bold text-white">85.6%</span>
                </div>
              </div>
              <div className="text-sm text-gray-400 text-center space-y-1">
                <div className="hover:text-white transition-colors">🔴 Dangerous: {Math.round(12543 * 0.4)}</div>
                <div className="hover:text-white transition-colors">🟠 Suspicious: {Math.round(12543 * 0.35)}</div>
                <div className="hover:text-white transition-colors">🟢 Clean: {Math.round(12543 * 0.25)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 rounded-lg overflow-hidden backdrop-blur-sm hover:border-[#6B73FF]/30 transition-all duration-300">
          <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-transparent">
            <h2 className="text-white font-semibold">Recent Scan Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30 border-b border-gray-700/50">
                <tr>
                  {["Email", "Date", "URL", "Risk", "Feedback"].map(
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
                      {item.email}
                    </td>
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
                        className="p-2 bg-gradient-to-r from-[#6B73FF]/20 to-[#5A62E8]/20 hover:from-[#6B73FF]/40 hover:to-[#5A62E8]/40 border border-[#6B73FF]/30 rounded-lg transition-all duration-300 hover:scale-110"
                        title="Send Feedback"
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
