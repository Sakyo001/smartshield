"use client"

import Image from "next/image"
import Link from "next/link"
import ThemeToggle from "@components/ui/ThemeToggle"
import Aurora from "../ui/Aurora"
import { useState, useEffect } from "react"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={`fixed z-50 transition-all duration-300 left-1/2 -translate-x-1/2 overflow-hidden ${
      isScrolled 
        ? "top-6 w-1/2 rounded-full bg-white/70 dark:bg-[#0a0a0f]/70 py-2" 
        : "top-0 w-full bg-white/95 dark:bg-[#0a0a0f]/95 py-4 rounded-none"
    } backdrop-blur-md dark:border-gray-800`}>
      {/* Aurora Background */}
      <div className={`absolute inset-0 h-full w-full dark:block hidden transition-opacity duration-300 ${isScrolled ? "opacity-40" : "opacity-100"} ${isScrolled ? "rounded-full" : "rounded-none"}`}>
        <Aurora 
          colorStops={["#545BFF", "#b19eef", "#545BFF"]}
          amplitude={1.5}
          blend={0.6}
        />
      </div>
      <div className="w-full mx-auto px-4 md:px-6 flex items-center justify-between relative z-10">
      {/* Logo Section */}
      <Link href="/" className="flex items-center gap-3 group transition-all duration-300">

      {/* 1. The Logo Icon */}
      <div className={`relative shrink-0 transition-all duration-300 ${isScrolled ? "w-10 h-10" : "w-15 h-15"}`}>
     <Image 
       src="/images/light-logo.png" 
       alt="SmartShield Logo" fill
       className="object-contain" 
       priority/>
  </div>

  {/* 2. The Text Container - This is the key part */}
  {/* 'flex-col' stacks the items vertically */}
  <div className="flex flex-col justify-center">
    {/* Title */}
    <span className={`text-gray-900 dark:text-white font-bold leading-none tracking-wide transition-all duration-300 ${isScrolled ? "text-lg" : "text-2xl"}`}>
      SmartShield
    </span>
    
    {/* Tagline */}
    <span className={`font-medium text-[#5667FF] tracking-wide transition-all duration-300 ${isScrolled ? "text-[9px] mt-0" : "text-[11px] mt-1"}`}>
      AI-Powered Phishing Detector
    </span>
  </div>
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
          <Link href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
          Sign In
          </Link>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />
      </div>
    </nav>
  )
}