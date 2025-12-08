import ThemeToggle from "@components/ui/ThemeToggle";

import Image from "next/image";

import Link from "next/link";

import { useEffect, useState } from "react";

import Aurora from "../ui/Aurora";

// 1. Remove Nico_Moji from here. Only keep Poppins.

import { Poppins } from "next/font/google";

// 2. Configure Poppins (This works fine)

const poppins = Poppins({
  weight: ["400", "500", "600"],

  subsets: ["latin"],

  display: "swap",
});

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-gray-50/90 dark:bg-[#141414]/90 backdrop-blur-md shadow-sm dark:border-b dark:border-white/5"
          : "bg-transparent border-transparent"
      }`}
    >
      <div
        className={`absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300 ${
          isScrolled ? "opacity-40" : "opacity-0"
        }`}
      >
        <Aurora
          colorStops={["#545BFF", "#b19eef", "#545BFF"]}
          amplitude={1.5}
          blend={0.6}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between relative z-10">
        {/* Logo Section */}

        <Link
          href="/"
          className="flex items-center gap-3 group transition-opacity hover:opacity-80"
        >
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
            {/* 3. Use the CSS class 'font-nico' instead of the Next.js variable */}

            <span className="font-nico text-gray-900 dark:text-white text-xl md:text-2xl tracking-wide">
              SmartShield
            </span>

            <span className="font-medium text-[#5667FF] tracking-wide text-[11px] md:text-xs mt-1">
              AI-Powered Phishing Detector
            </span>
          </div>
        </Link>

        {/* Navigation Links - Centered & Poppins Font */}

        <div
          className={`hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 ${poppins.className}`}
        >
          {["Home", "Scan", "About", "FAQ"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#5667FF] dark:hover:text-[#5667FF] transition-colors"
            >
              {item}
            </Link>
          ))}

          <Link
            href="/signin"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#5667FF] dark:hover:text-[#5667FF] transition-colors"
          >
            Sign In
          </Link>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
}
