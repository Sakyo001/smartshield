"use client"

import Image from "next/image"
import Link from "next/link"
import ThemeToggle from "@components/ui/ThemeToggle"

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/light-logo.png" alt="SmartShield" width={36} height={36} priority/>
          <span className="text-gray-900 dark:text-white text-lg font-semibold transition-colors">SmartShield</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#home" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
            Home
          </Link>
          <Link href="#scan" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
            Scan
          </Link>
          <Link href="#about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
            About
          </Link>
          <Link href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
            FAQ
          </Link>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />
      </div>
    </nav>
  )
}