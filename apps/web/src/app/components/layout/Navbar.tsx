"use client"

import Image from "next/image"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/light-logo.png" alt="SmartShield" width={36} height={36} />
          <span className="text-white text-lg font-semibold">SmartShield</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#home" className="text-gray-300 hover:text-white transition text-sm">Home</Link>
          <Link href="#scan" className="text-gray-300 hover:text-white transition text-sm">Scan</Link>
          <Link href="#about" className="text-gray-300 hover:text-white transition text-sm">About</Link>
          <Link href="#faq" className="text-gray-300 hover:text-white transition text-sm">FAQ</Link>
        </div>

        <Link 
          href="/login"
          className="text-white border border-white rounded-full px-5 py-2 hover:bg-white hover:text-[#0a0a0f] transition flex items-center gap-2 text-sm"
        >
          Try For Free Now
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </nav>
  )
}