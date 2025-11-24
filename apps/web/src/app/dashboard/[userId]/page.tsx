"use client"
import { useAuth } from "@lib/auth-context"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { saveScanResult, getTodaysScans, addToWhitelist, addToBlacklist, addToPhishingSites } from "@lib/supabase"

interface ScanResult {
  url: string
  riskScore: number
  status: "Safe" | "Warning" | "Dangerous"
  date: string
  details?: {
    registrar?: string
    creationDate?: string
    lastAnalysisDate?: string
    detections?: Array<{ service: string; category: string; result: string }>
    whoisInfo?: any
    dnsRecords?: any
    sslCertificates?: any
    communityComments?: number
  }
}

export default function UserDashboard() {
  const { user, loading, signOut } = useAuth()
  const [urlInput, setUrlInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"detection" | "details" | "relations" | "community">("detection")

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  // Load today's scans on mount
  useEffect(() => {
    if (user) {
      loadTodaysScans()
    }
  }, [user])

  const loadTodaysScans = async () => {
    if (!user) return
    
    try {
      const scans = await getTodaysScans(user.id)
      const formattedScans: ScanResult[] = scans.map(scan => {
        let status: "Safe" | "Warning" | "Dangerous" = "Safe"
        const confidence = scan.confidence || 0
        
        if (confidence >= 70) {
          status = "Dangerous"
        } else if (confidence >= 40) {
          status = "Warning"
        }
        
        return {
          url: scan.url,
          riskScore: confidence,
          status: status,
          date: new Date(scan.created_at).toLocaleString(),
          details: scan.prediction
        }
      })
      setRecentScans(formattedScans)
    } catch (error) {
      console.error("Error loading today's scans:", error)
    }
  }
  

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput) return
    
    setScanning(true)
    setError(null)
    setCurrentScan(null)
    
    try {
      const response = await fetch("https://phishguard-api-kwpg.onrender.com/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlInput })
      })

      if (!response.ok) {
        throw new Error("Failed to scan URL")
      }

      const data = await response.json()
      
      // Calculate risk score and status based on API response
      const riskScore = data.phishing_score || data.risk_score || 0
      let status: "Safe" | "Warning" | "Dangerous" = "Safe"
      
      if (riskScore >= 70) {
        status = "Dangerous"
      } else if (riskScore >= 40) {
        status = "Warning"
      }

      const scanResult: ScanResult = {
        url: urlInput,
        riskScore: riskScore,
        status: status,
        date: new Date().toLocaleString(),
        details: {
          registrar: data.registrar || "Key-Systems, LLC",
          creationDate: data.creation_date || "4 years ago",
          lastAnalysisDate: data.last_analysis_date || "24 days ago",
          detections: data.detections || [],
          whoisInfo: data.whois,
          dnsRecords: data.dns_records,
          sslCertificates: data.ssl_certificates,
          communityComments: data.community_comments || 0
        }
      }

      setCurrentScan(scanResult)
      setRecentScans(prev => [scanResult, ...prev.slice(0, 9)])
      
      // Save to Supabase
      if (user) {
        try {
          const urlObj = new URL(urlInput)
          const domain = urlObj.hostname
          
          // Save to extension_activity
          await saveScanResult(user.id, {
            url: urlInput,
            domain: domain,
            confidence: riskScore,
            decision: status.toLowerCase(),
            prediction: data
          })
          
          // Add to appropriate lists based on risk score
          if (riskScore < 40) {
            // Safe site - add to whitelist
            await addToWhitelist(domain, user.id, `Safe site detected with ${riskScore}% risk score`)
          } else if (riskScore >= 70) {
            // Phishing site - add to blacklist and phishing_sites
            await addToBlacklist(domain, user.id, `Phishing site detected with ${riskScore}% risk score`)
            await addToPhishingSites(urlInput, domain, data)
          }
          // Sites with 40-69 risk score (Warning) are not added to any list
          
        } catch (saveError) {
          console.error("Error saving scan result:", saveError)
          // Don't show error to user, just log it
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while scanning")
    } finally {
      setScanning(false)
    }
  }

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
            Logout
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

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L10 5L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Try example</span>
          </div>
        </div>

        {/* Scan Results */}
        {currentScan && (
          <div className="max-w-6xl mx-auto mb-20">
            {/* Risk Score Card */}
            <div className="bg-gray-200 dark:bg-[#0f0f1e] border-0 dark:border dark:border-gray-800 rounded-lg p-8 mb-6">
              <div className="flex items-start gap-6">
                {/* Risk Score Badge */}
                <div className="flex-shrink-0">
                  <div className="bg-[#1e2235] rounded-lg p-6 shadow-lg">
                    <div className="text-sm font-semibold text-gray-400 mb-4 text-center">Risk Score</div>
                    <div className="flex flex-col items-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                          <circle
                            cx="70"
                            cy="70"
                            r="60"
                            stroke="#2a2d47"
                            strokeWidth="12"
                            fill="none"
                          />
                          <circle
                            cx="70"
                            cy="70"
                            r="60"
                            stroke={currentScan.status === "Dangerous" ? "#EF4444" : currentScan.status === "Warning" ? "#F59E0B" : "#10B981"}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${(currentScan.riskScore / 100) * 377} 377`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl font-bold text-white">{currentScan.riskScore}</span>
                        </div>
                      </div>
                      <div className={`mt-4 ${getStatusColor(currentScan.status)} text-white text-sm px-5 py-2 rounded-full font-semibold`}>
                        {currentScan.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detection Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                      <path d="M10 2L3 6V10C3 14.5 6 18 10 18C14 18 17 14.5 17 10V6L10 2Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 6V10M10 13V13.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className={`text-sm font-medium ${
                      currentScan.status === "Dangerous" 
                        ? "text-red-600 dark:text-red-400" 
                        : currentScan.status === "Warning"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}>
                      {currentScan.status === "Dangerous" 
                        ? `SmartShield detects strong phishing indicators and high-risk behaviors on this site.` 
                        : currentScan.status === "Warning"
                        ? `This website has some suspicious indicators. Proceed with caution.`
                        : `This website appears safe based on our analysis.`}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-white">{currentScan.url}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Registrar</div>
                        <div className="font-medium text-gray-900 dark:text-white">{currentScan.details?.registrar}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Creation Date</div>
                        <div className="font-medium text-gray-900 dark:text-white">{currentScan.details?.creationDate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Last Analysis Date</div>
                        <div className="font-medium text-gray-900 dark:text-white">{currentScan.details?.lastAnalysisDate}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-400 dark:hover:border-gray-500 transition">
                    <span className="text-xs">Reanalyze</span>
                  </button>
                  <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-400 dark:hover:border-gray-500 transition">
                    <span className="text-xs">More</span>
                  </button>
                </div>
              </div>

              {/* Community Link */}
              <div className="mt-6 p-4 bg-[#1a1a2e] border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">
                  Join the{" "}
                  <Link href="#" className="text-[#7B83FF] hover:underline">SmartShield Community</Link>
                  {" "}to access crowdsourced threat insights, early detections, and{" "}
                  <Link href="#" className="text-[#7B83FF] hover:underline">automated URL checks</Link>.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#0f0f1e] border border-gray-800 rounded-lg overflow-hidden">
              <div className="flex border-b border-gray-800">
                <button
                  onClick={() => setActiveTab("detection")}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    activeTab === "detection"
                      ? "text-[#7B83FF] border-b-2 border-[#7B83FF]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Detection
                </button>
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    activeTab === "details"
                      ? "text-[#7B83FF] border-b-2 border-[#7B83FF]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("relations")}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    activeTab === "relations"
                      ? "text-[#7B83FF] border-b-2 border-[#7B83FF]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Relations
                </button>
                <button
                  onClick={() => setActiveTab("community")}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    activeTab === "community"
                      ? "text-[#7B83FF] border-b-2 border-[#7B83FF]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Community
                </button>
              </div>

              <div className="p-6">
                {activeTab === "detection" && (
                  <div>
                    <div className="grid grid-cols-2 gap-px bg-gray-800">
                      {/* Display only scanned URL and status */}
                      <div className="bg-[#0f0f1e] p-4 flex items-center justify-between col-span-2">
                        <span className="text-white text-sm">{currentScan.url}</span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          currentScan.riskScore >= 70 
                            ? "bg-red-500/20 text-red-400" 
                            : currentScan.riskScore >= 40
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {currentScan.riskScore >= 70 ? "Phishing" : currentScan.riskScore >= 40 ? "Suspicious" : "Safe"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-gray-400 mb-2">WHOIS Information</h4>
                      <div className="bg-[#1a1a2e] p-4 rounded border border-gray-800 text-gray-300 font-mono text-xs overflow-x-auto">
                        {currentScan.details?.whoisInfo ? (
                          <pre>{JSON.stringify(currentScan.details.whoisInfo, null, 2)}</pre>
                        ) : (
                          <p>No WHOIS data available</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-400 mb-2">DNS Records</h4>
                      <div className="bg-[#1a1a2e] p-4 rounded border border-gray-800 text-gray-300">
                        {currentScan.details?.dnsRecords ? (
                          <pre className="text-xs font-mono">{JSON.stringify(currentScan.details.dnsRecords, null, 2)}</pre>
                        ) : (
                          <p className="text-xs">No DNS records available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "relations" && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Analyzing domain relationships...</p>
                  </div>
                )}

                {activeTab === "community" && (
                  <div className="text-center py-12">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4 opacity-50">
                      <path d="M32 8L16 16V28C16 38 24 46 32 50C40 46 48 38 48 28V16L32 8Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3 className="text-white font-semibold mb-2">No Comments Found</h3>
                    <p className="text-gray-400 mb-6">Write a comment</p>
                    <textarea
                      placeholder="Enter a comment"
                      className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#7B83FF] mb-4"
                      rows={4}
                    />
                    <button className="bg-[#6B73FF] text-white px-6 py-2 rounded-lg hover:bg-[#5A62E8] transition">
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                {recentScans.length > 0 ? (
                  recentScans.map((scan, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-[#1a1a2e] transition cursor-pointer" onClick={() => setCurrentScan(scan)}>
                      <td className="px-6 py-4 text-gray-300 text-sm">{scan.url}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{scan.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-gray-400 text-sm">{scan.riskScore}%</span>
                          <span className={`${getStatusColor(scan.status)} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                            {scan.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                      No scans yet. Enter a URL above to get started.
                    </td>
                  </tr>
                )}
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
