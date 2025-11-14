import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-gray-800 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left: Logo and name */}
          <div className="flex items-center gap-3">
            <Image src="/images/light-logo.png" alt="SmartShield" width={32} height={32} />
            <span className="text-white text-lg font-semibold">SmartShield</span>
          </div>

          {/* Right: Links */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <Link href="/about" className="text-gray-400 hover:text-white transition">
              SmartShield
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition">
              Terms and Condition
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/about" className="text-gray-400 hover:text-white transition">
              About
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}