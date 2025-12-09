"use client";

import { useTheme } from "@/app/lib/theme-context";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="relative inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <div className="relative w-14 h-7 bg-gray-300 dark:bg-gray-700 rounded-full transition-colors">
          <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Toggle Switch */}
      <div className="relative w-14 h-7 bg-gray-300 dark:bg-gray-700 rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
            isDark ? "translate-x-7" : "translate-x-0"
          }`}
        />

        {/* Sun Icon (Light Mode) */}
        <svg
          className={`absolute left-1.5 top-1.5 w-4 h-4 transition-opacity ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="3" fill="#FDB813" />
          <path
            d="M8 1V2M8 14V15M15 8H14M2 8H1M12.95 12.95L12.25 12.25M3.75 3.75L3.05 3.05M12.95 3.05L12.25 3.75M3.75 12.25L3.05 12.95"
            stroke="#FDB813"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Moon Icon (Dark Mode) */}
        <svg
          className={`absolute right-1.5 top-1.5 w-4 h-4 transition-opacity ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 8.5C13.5 11.5 10.5 14 7 14C3.5 14 1 11.5 1 8C1 4.5 3.5 2 7 2C7.5 2 8 2.1 8.5 2.2C7 3.5 6 5.5 6 7.5C6 10.5 8.5 13 11.5 13C12.5 13 13.5 12.7 14 12.2V8.5Z"
            fill="#7B83FF"
          />
        </svg>
      </div>
    </button>
  );
}
