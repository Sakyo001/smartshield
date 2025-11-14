"use client"
import { useAuth } from "@lib/auth-context"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function UserDashboard() {
  const { user, loading, signOut } = useAuth()
  const [urlInput, setUrlInput] = useState("")
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput) return
    
    setScanning(true)
    // Simulate scanning
    setTimeout(() => {
      setScanning(false)
      // Add to recent scans
    }, 2000)
  }

  const recentScans = [
    { url: "http://secure-example.com", date: "10/13/2025, 05:27 PM", score: 92.4, status: "Dangerous" },
    { url: "http://example-mine.tk", date: "10/13/2025, 04:18 PM", score: 74.2, status: "Dangerous" },
    { url: "http://billing-email-invoice.info", date: "10/13/2025, 03:56 PM", score: 88.6, status: "Warning" },
    { url: "https://www.freshtutorialsites.in", date: "10/13/2025, 11:22 PM", score: 5.5, status: "Safe" },
    { url: "http://myfacebook-login-reset.pw", date: "10/13/2025, 11:48 AM", score: 91.8, status: "Dangerous" },
    { url: "https://www.financialnotebank.com", date: "10/13/2025, 10:15 AM", score: 12.3, status: "Safe" },
    { url: "http://verify-your-identity-to-nspt.net", date: "10/13/2025, 09:30 AM", score: 96.5, status: "Dangerous" },
    { url: "http://bank-alert-suspicious-check.xyz", date: "10/13/2025, 08:42 AM", score: 89.7, status: "Dangerous" },
    { url: "http://paypal-verification-center.net", date: "10/13/2025, 07:15 AM", score: 93.6, status: "Dangerous" },
    { url: "http://download-freegamings.com", date: "10/13/2025, 06:53 AM", score: 46.2, status: "Dangerous" }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Safe": return "bg-green-500"
      case "Warning": return "bg-yellow-500"
      case "Dangerous": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/light-logo.png" alt="SmartShield" width={36} height={36} />
            <span className="text-white text-lg font-semibold">SmartShield</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white transition text-sm">Home</Link>
            <Link href="#scan" className="text-gray-300 hover:text-white transition text-sm">Scan</Link>
            <Link href="#about" className="text-gray-300 hover:text-white transition text-sm">About</Link>
            <Link href="#faq" className="text-gray-300 hover:text-white transition text-sm">FAQ</Link>
          </div>

          <button 
            onClick={async () => {
              await signOut()
              redirect("/login")
            }}
            className="text-white border border-white rounded-full px-5 py-2 hover:bg-white hover:text-[#0a0a0f] transition flex items-center gap-2 text-sm"
          >
            Try For Free Now
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Is This Website <span className="text-[#7B83FF]">Safe</span>? Find Out Instantly
        </h1>

        {/* Scan Box */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="flex items-start gap-3 mb-6">
            <Image src="/images/light-logo.png" alt="SmartShield" width={40} height={40} />
            <div>
              <h3 className="text-white font-semibold mb-1">SmartShield</h3>
              <p className="text-gray-400 text-sm">
                Scan any website link and instantly detect phishing threats with AI-powered accuracy.
              </p>
            </div>
          </div>

          <form onSubmit={handleScan} className="flex items-center gap-3 mb-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter website url (e.g. https://example.com)"
              className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#7B83FF]"
            />
            <button
              type="submit"
              disabled={scanning || !urlInput}
              className="bg-[#6B73FF] text-white px-6 py-3 rounded-lg hover:bg-[#5A62E8] transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11L11 7L7 3M11 7H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {scanning ? "Scanning..." : "Scan website"}
            </button>
          </form>

          <p className="text-gray-500 text-xs text-center">
            By entering a URL, you agree to our{" "}
            <Link href="/terms" className="text-[#7B83FF] hover:underline">terms of service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#7B83FF] hover:underline">privacy policy</Link>.
          </p>

          <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L10 5L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Try example</span>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#7B83FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="text-2xl font-bold text-white">Recent URL Scans</h2>
          </div>

          <div className="bg-[#0f0f1e] border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">URL / Domain</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Recent Scan</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-[#1a1a2e] transition">
                    <td className="px-6 py-4 text-gray-300 text-sm">{scan.url}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{scan.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-gray-400 text-sm">{scan.score}%</span>
                        <span className={`${getStatusColor(scan.status)} text-white text-xs px-3 py-1 rounded-full font-medium`}>
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
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image src="/images/light-logo.png" alt="SmartShield" width={32} height={32} />
              <span className="text-white text-lg font-semibold">SmartShield</span>
            </div>

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
    </div>
  )
}
