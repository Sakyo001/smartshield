"use client"

import { useTheme } from "@lib/theme-context"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-white/30 hover:border-gray-400 dark:hover:border-white/50 transition-colors"
      aria-label="Toggle theme"
    >
      <span className="text-gray-700 dark:text-white text-sm">Try For Free Now</span>
      
      {/* Toggle Switch */}
      <div className="relative w-12 h-6 bg-gray-300 dark:bg-white/20 rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-white rounded-full shadow-md transition-transform duration-300 ${
            isDark ? "translate-x-6" : "translate-x-0"
          }`}
        />
        
        {/* Sun Icon (Light Mode) */}
        <svg
          className={`absolute left-1 top-1 w-4 h-4 transition-opacity ${
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
          className={`absolute right-1 top-1 w-4 h-4 transition-opacity ${
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

      {/* Arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-700 dark:text-white"
      >
        <path
          d="M6 12L10 8L6 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
