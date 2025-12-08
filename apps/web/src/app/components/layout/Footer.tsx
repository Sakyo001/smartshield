import Image from "next/image";
import Link from "next/link";
import Aurora from "../ui/Aurora";

export default function Footer() {
  return (
    <footer className="relative bg-gray-100 dark:bg-[#0a0a0f] border-t border-gray-300 dark:border-gray-800 py-8 px-6 transition-colors overflow-hidden">
      {/* --- Aurora Background Effect --- */}
      {/* 1. Anchored firmly to bottom (bottom-0) */}
      {/* 2. Fixed height (h-[500px]) to ensure large, visible waves rising up */}
      {/* 3. opacity-100 for maximum visibility */}
      <div className="absolute bottom-0 left-0 w-full h-[500px] pointer-events-none z-0">
        <div className="w-full h-full opacity-100 [mask-image:linear-gradient(to_top,black_40%,transparent_100%)]">
          <Aurora
            colorStops={["#545BFF", "#b19eef", "#545BFF"]}
            amplitude={1.2}
            blend={0.6}
            speed={0.5}
          />
        </div>
      </div>

      {/* --- Footer Content --- */}
      {/* z-10 ensures content sits ON TOP of the Aurora overlay */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left: Logo and name */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/light-logo.png"
              alt="SmartShield"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-gray-900 dark:text-white text-lg font-semibold transition-colors">
              SmartShield
            </span>
          </div>

          {/* Right: Links */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <Link
              href="/about"
              className="text-gray-600 dark:text-gray-400 hover:text-[#545BFF] dark:hover:text-[#545BFF] transition-colors"
            >
              SmartShield
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 dark:text-gray-400 hover:text-[#545BFF] dark:hover:text-[#545BFF] transition-colors"
            >
              Terms and Condition
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-[#545BFF] dark:hover:text-[#545BFF] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/about"
              className="text-gray-600 dark:text-gray-400 hover:text-[#545BFF] dark:hover:text-[#545BFF] transition-colors"
            >
              About
            </Link>
            <Link
              href="/cookies"
              className="text-gray-600 dark:text-gray-400 hover:text-[#545BFF] dark:hover:text-[#545BFF] transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
