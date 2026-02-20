"use client"
import { useAuth } from "@lib/auth-context"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { saveScanResult, getTodaysScans, addToWhitelist, addToBlacklist, addToPhishingSites } from "@lib/supabase"
import { MultiStepLoader } from "../../components/ui/multi-step-loader";
import Aurora from "../../components/ui/Aurora";

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
    riskAdjustment?: any
  }
}

// Utility for fetch with timeout
async function fetchWithTimeout(resource: RequestInfo, options: any = {}) {
  const { timeout = 30000 } = options; // 30 seconds default
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, { 
      ...options, 
      signal: controller.signal 
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - API is taking too long to respond');
    }
    throw error;
  }
}

export default function UserDashboard() {
  const { user, loading, signOut } = useAuth()
  const [urlInput, setUrlInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"detection" | "details" | "relations" | "explanation" | "community">("detection")
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [xaiExplanation, setXaiExplanation] = useState<any>(null)
  const [loadingXAI, setLoadingXAI] = useState(false)

  // Community comments state
  const [communityComments, setCommunityComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentSuccess, setCommentSuccess] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<'legitimate' | 'phishing' | 'neutral'>('neutral')

  // Load XAI explanation when scan result is available
  useEffect(() => {
    const fetchXAIExplanation = async () => {
      if (currentScan) {
        setLoadingXAI(true)
        try {
          const response = await fetch(`${WHOIS_API_URL}/api/explain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: currentScan.url,
              scan_result: {
                riskScore: currentScan.riskScore,
                decision: currentScan.status,
                detections: currentScan.details?.detections || []
              },
              whois_info: currentScan.details?.whoisInfo || {},
              dns_info: currentScan.details?.dnsRecords || {},
              ssl_info: currentScan.details?.sslCertificates || {},
              deterministic_flags: currentScan.details?.riskAdjustment?.deterministic_flags || []
            })
          })
          if (response.ok) {
            const data = await response.json()
            console.log('📊 XAI Explanation received:', {
              risk_factors_count: data.risk_factors?.length || 0,
              positive_factors_count: data.positive_factors?.length || 0,
              risk_factors: data.risk_factors,
              deterministic_flags_sent: currentScan.details?.riskAdjustment?.deterministic_flags
            })
            setXaiExplanation(data)
          }
        } catch (error) {
          console.error("Error fetching XAI explanation:", error)
        } finally {
          setLoadingXAI(false)
        }
      }
    }
    
    fetchXAIExplanation()
  }, [currentScan])

  // Fetch comments for current scan
  useEffect(() => {
    const fetchComments = async () => {
      if (activeTab === "community" && currentScan) {
        setLoadingComments(true)
        try {
          // Fetch feedback from reports table
          const response = await fetch(`${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(currentScan.url)}`)
          if (response.ok) {
            const data = await response.json()
            setCommunityComments(data.reports || [])
          } else {
            setCommunityComments([])
          }
        } catch (err) {
          setCommunityComments([])
        } finally {
          setLoadingComments(false)
        }
      }
    }
    fetchComments()
  }, [activeTab, currentScan])

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !currentScan || !user) return
    setSubmittingComment(true)
    setCommentError(null)
    setCommentSuccess(false)
    try {
      // Submit feedback to reports table
      const response = await fetch(`${WHOIS_API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentScan.url,
          user_id: user.id,
          description: commentInput.trim(),
          flag: selectedFlag
        })
      })
      if (response.ok) {
        const data = await response.json()
        setCommunityComments(data.reports || [])
        setCommentInput("")
        setSelectedFlag('neutral')
        setCommentSuccess(true)
        // Clear success message after 3 seconds
        setTimeout(() => setCommentSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setCommentError(errorData.error || "Failed to submit comment")
      }
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to submit comment")
    } finally {
      setSubmittingComment(false)
    }
  }

  // API URL - uses environment variable for production, falls back to localhost for development
  const WHOIS_API_URL = process.env.NEXT_PUBLIC_WHOIS_API_URL

  const loadingStates = [
    { text: "Initializing phishing detection system..." },
    { text: "Analyzing URL structure and patterns..." },
    { text: "Checking against threat intelligence databases..." },
    { text: "Fetching WHOIS and DNS records..." },
    { text: "Examining SSL certificates..." },
    { text: "Running AI-powered risk assessment..." },
    { text: "Finalizing security analysis..." },
  ]

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Check Whois API health
        const whoisApiCheck = fetch(`${WHOIS_API_URL}/health`, { 
          method: "GET"
        }).catch(() => null);
        
        const [whoisResponse] = await Promise.all([whoisApiCheck]);
        
        if (whoisResponse?.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (error) {
        console.warn('API health check failed:', error);
        setApiStatus('offline');
      }
    };
    
    checkApiHealth();
  }, [])

  // Load historical data when Relations tab is clicked
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (activeTab === "relations" && currentScan && !historicalData && !loadingHistory) {
        setLoadingHistory(true)
        try {
          const response = await fetchWithTimeout(`${WHOIS_API_URL}/api/domain-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentScan.url }),
            timeout: 15000 // 15 seconds for history
          })
          if (response.ok) {
            const data = await response.json()
            setHistoricalData(data)
          }
        } catch (error) {
          console.error("Error loading history:", error)
        } finally {
          setLoadingHistory(false)
        }
      }
    }
    
    loadHistoricalData()
  }, [activeTab, currentScan])

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
      const response = await fetchWithTimeout(`${WHOIS_API_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlInput }),
        timeout: 30000 // 30 seconds
      })

      if (!response.ok) {
        throw new Error("Failed to scan URL")
      }

      const data = await response.json()
      
      // Calculate risk score and status based on API response
      // API returns: confidence (0-100), decision ("PHISHING" or "LEGITIMATE")
      // For LEGITIMATE: confidence is how confident it's safe (high = safe)
      // For PHISHING: confidence is how confident it's dangerous (high = dangerous)
      
      let riskScore = 0
      let status: "Safe" | "Warning" | "Dangerous" = "Safe"
      
      if (data.decision === "PHISHING") {
        // If PHISHING, confidence represents danger level (100 = very dangerous)
        riskScore = Math.round(data.confidence || 100)
        if (riskScore >= 70) {
          status = "Dangerous"
        } else if (riskScore >= 40) {
          status = "Warning"
        } else {
          status = "Safe"
        }
      } else if (data.decision === "LEGITIMATE") {
        // If LEGITIMATE, confidence represents safety (100 = very safe)
        // Invert it to get risk score (100% safe = 0% risk)
        riskScore = Math.round(100 - (data.confidence || 0))
        if (riskScore >= 70) {
          status = "Dangerous"
        } else if (riskScore >= 40) {
          status = "Warning"
        } else {
          status = "Safe"
        }
      } else {
        // Fallback to old score calculation
        riskScore = Math.round(data.score * 100 || 0)
        if (riskScore >= 70) {
          status = "Dangerous"
        } else if (riskScore >= 40) {
          status = "Warning"
        }
      }

      // Fetch WHOIS, DNS, and SSL information from Python API
      let whoisInfo = null
      let dnsRecords = null
      let sslInfo = null
      let riskAdjustment = null
      
      try {
        const domainInfoResponse = await fetchWithTimeout(`${WHOIS_API_URL}/api/domain-info`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: urlInput }),
          timeout: 45000 // 45 seconds for WHOIS/DNS/SSL (some domains are slow)
        })
        
        if (domainInfoResponse.ok) {
          const domainData = await domainInfoResponse.json()
          whoisInfo = domainData.whois
          dnsRecords = domainData.dns
          sslInfo = domainData.ssl
          riskAdjustment = domainData.risk_adjustment
          console.log(`DEBUG: Full riskAdjustment object:`, JSON.stringify(riskAdjustment, null, 2))
          
          // CHECK FOR HTTP FIRST - this should always be a warning at minimum
          if (urlInput.toLowerCase().startsWith('http://')) {
            console.log(`🚨 HTTP DETECTED: URL uses insecure HTTP protocol`)
            // Set minimum warning level for HTTP
            if (riskScore < 40) {
              riskScore = 40
              status = "Warning"
              console.log(`🚨 Upgrading to Warning due to HTTP protocol`)
            }
          }
          
          // MULTI-LAYER RISK ADJUSTMENT
          // Layer 1: Deterministic rules increase risk for obvious phishing
          // Layer 3: Contextual enrichment decreases risk for established domains
          if (riskAdjustment) {
            const originalRiskScore = riskScore
            const deterministicIncrease = riskAdjustment.deterministic_increase || 0
            const contextualReduction = riskAdjustment.reduction_percentage || 0
            const indicators = riskAdjustment.indicators || []
            
            console.log(`🔍 Risk Adjustment Data Received:`)
            console.log(`  Original ML Score: ${originalRiskScore}%`)
            console.log(`  Deterministic Increase: +${deterministicIncrease}%`)
            console.log(`  Contextual Reduction: ${contextualReduction}%`)
            console.log(`  Indicators Array:`, indicators)
            console.log(`  Indicators Length:`, indicators.length)
            
            // CHECK FOR CRITICAL INDICATORS FIRST - these override everything
            const criticalIndicators = indicators && indicators.length > 0 
              ? indicators.filter((indicator: string) => 
                  typeof indicator === 'string' && (indicator.includes('CRITICAL') || indicator.includes('🚨'))
                )
              : []
            
            console.log(`  Critical Indicators Found:`, criticalIndicators)
            console.log(`  Critical Count:`, criticalIndicators.length)
            
            if (criticalIndicators.length > 0) {
              // ANY critical security issue = instant 100% Dangerous
              riskScore = 100
              status = "Dangerous"
              console.log(`🚨 CRITICAL SECURITY ISSUE DETECTED:`, criticalIndicators)
              console.log(`🚨 Forcing 100% risk score and Dangerous status`)
            } else {
              // No critical issues - apply normal multi-layer calculations
              riskScore = riskScore + deterministicIncrease - contextualReduction
              riskScore = Math.max(0, Math.min(100, riskScore))
              riskScore = Math.round(riskScore)
              
              // SAFETY CHECK: If WHOIS info is unavailable, enforce minimum risk score
              const hasWhoisWarning = indicators && indicators.some((indicator: string) => 
                typeof indicator === 'string' && indicator.includes('WHOIS Information Unavailable') && !indicator.includes('CRITICAL')
              )
              if (hasWhoisWarning && riskScore < 45) {
                riskScore = 45
                console.log(`⚠️ WHOIS unavailable - enforcing minimum risk score of 45%`)
              }
              
              // Recalculate status based on adjusted risk score
              if (riskScore >= 70) {
                status = "Dangerous"
              } else if (riskScore >= 40) {
                status = "Warning"
              } else {
                status = "Safe"
              }
            }
            
            console.log(`🔍 Multi-Layer Risk Assessment Final:`)
            console.log(`  Original Score: ${originalRiskScore}%`)
            console.log(`  Final Score: ${riskScore}%`)
            console.log(`  Status: ${status}`)
            console.log(`  Deterministic Flags:`, riskAdjustment.deterministic_flags)
          }
        }
      } catch (domainError) {
        console.error("Error fetching domain info:", domainError)
        // CRITICAL: Cannot verify domain security - treat as high risk
        console.log(`🚨 CRITICAL: Domain verification service is slow or unavailable`)
        
        // If we cannot reach the domain verification API, we cannot confirm the site is safe
        // This is a critical security issue - force high risk score
        const originalRiskScore = riskScore
        riskScore = Math.max(riskScore, 75) // Minimum 75% risk if we can't verify
        status = riskScore >= 70 ? "Dangerous" : "Warning"
        
        console.log(`🚨 Domain verification service timeout:`)
        console.log(`  Original Score: ${originalRiskScore}%`)
        console.log(`  Enforced Score: ${riskScore}% (security verification service unavailable)`)
        console.log(`  Status: ${status}`)
        
        // Set error flags so XAI can explain this
        // These are set to timeout to indicate the verification service couldn't respond, not that the website itself is down
        whoisInfo = { error: 'Background verification service took too long - unable to retrieve domain registration details', is_timeout: true }
        dnsRecords = { error: 'Background verification service took too long - unable to check DNS configuration', is_timeout: true }
        sslInfo = { error: 'Background verification service took too long - unable to verify SSL certificate', is_timeout: true }
      }

      const scanResult: ScanResult = {
        url: urlInput,
        riskScore: riskScore,
        status: status,
        date: new Date().toLocaleString(),
        details: {
          registrar: whoisInfo?.registrar || "N/A",
          creationDate: whoisInfo?.creation_date || "N/A",
          lastAnalysisDate: new Date().toLocaleDateString(),
          detections: data.detections || [],
          whoisInfo: whoisInfo,
          dnsRecords: dnsRecords,
          sslCertificates: sslInfo,
          communityComments: data.community_comments || 0,
          riskAdjustment: riskAdjustment
        }
      }

      setCurrentScan(scanResult)
      setRecentScans(prev => [scanResult, ...prev.slice(0, 9)])
      
      // Save to Supabase
      if (user) {
        try {
          // Normalize URL - add protocol if missing
          let normalizedUrl = urlInput.trim()
          if (!normalizedUrl.match(/^https?:\/\//i)) {
            normalizedUrl = 'https://' + normalizedUrl
          }
          
          // Extract domain from URL
          let domain = normalizedUrl
          try {
            const urlObj = new URL(normalizedUrl)
            domain = urlObj.hostname
          } catch (urlError) {
            // If URL parsing fails, try to extract domain manually
            domain = normalizedUrl.replace(/^https?:\/\//, '').split('/')[0].split('?')[0].split('#')[0]
          }
          
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
    <div className="relative min-h-screen bg-[#0a0a0f] text-gray-100 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora colorStops={["#545BFF", "#8B5CF6", "#0a0a0f"]} amplitude={1.0} blend={0.6} />
        <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10">
      <MultiStepLoader loadingStates={loadingStates} loading={scanning} duration={1500} />

      {/* Navbar */}
      <nav className="border-b border-gray-800/50 bg-[#0a0a0f]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">

  {/* 1. The Logo - stays on the left */}
  <Image 
    src="/images/light-logo.png"  alt="SmartShield" width={32} height={32} className="md:w-15 md:h-15" 
  />

  {/* 2. Text Container - stacks the Title and Tagline vertically */}
  <div className="flex flex-col justify-center">
    
    {/* Title */}
    <span className="text-white text-base md:text-2xl font-semibold leading-none">
      SmartShield
    </span>

    {/* Tagline */}
    <span className="text-[10px] font-medium text-[#5667FF] tracking-wide mt-0.5">
      AI-Powered Phishing Detector
    </span>
    
  </div>
</Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white transition text-sm">Home</Link>
            <Link href="/#scan" className="text-gray-300 hover:text-white transition text-sm">Scan</Link>
            <Link href="/#about" className="text-gray-300 hover:text-white transition text-sm">About</Link>
            <Link href="/#faq" className="text-gray-300 hover:text-white transition text-sm">FAQ</Link>
          </div>

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="relative group text-white border border-gray-700 rounded-lg px-3 md:px-4 py-2 hover:border-[#7B83FF] hover:bg-[#7B83FF]/10 transition-all flex items-center gap-2 text-xs md:text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
              <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Title */}
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-8 md:mb-16">
          Is This Website <span className="text-[#7B83FF]">Safe</span>? Find Out Instantly
        </h1>

        {/* Scan Box */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="flex items-start gap-3 mb-6">
            <Image src="/images/logo 1.png" alt="SmartShield" width={54} height={54} />
            <div>
              <h3 className="text-white text-lg font-semibold mb-1">SmartShield</h3>
              <p className="text-gray-400 text-sm">
                Scan any website link and instantly detect phishing threats with AI-powered accuracy.
              </p>
            </div>
          </div>

          <form onSubmit={handleScan} className="relative group z-20 mb-6">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#545BFF] to-[#b19eef] rounded-xl opacity-30 blur transition duration-1000 group-hover:opacity-60 pointer-events-none ${scanning ? 'animate-pulse' : ''}`}></div>
            <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-[#0f0f1e] rounded-xl border border-gray-800">
              <div className="flex-1 flex items-center gap-3 px-4 w-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste a URL to scan (e.g., https://example.com)..."
                  className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 py-3 text-base"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={scanning || !urlInput}
                className={`
                  w-full sm:w-auto px-8 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2
                  ${scanning 
                    ? 'bg-gray-800 text-gray-400 cursor-wait' 
                    : 'bg-[#545BFF] hover:bg-[#4349dd] text-white shadow-lg shadow-[#545BFF]/20 hover:shadow-[#545BFF]/40'
                  }
                `}
              >
                {scanning ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <span>Scan Now</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                 )}
              </button>
            </div>
          </form>

         <p className="text-gray-500 text-[15px] text-center mt-4">
            By entering a URL, you agree to our{" "}
            <Link href="/terms" className="text-[#7B83FF] hover:underline">terms of service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#7B83FF] hover:underline">privacy policy</Link>.
          </p>


          {/* API Status Button */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#1a1a2e]/60 border border-gray-700/50 rounded-full backdrop-blur-sm">
              <div className="relative flex h-2.5 w-2.5">
                {apiStatus === 'online' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </>
                ) : (
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                )}
              </div>
              <span className={`text-xs font-medium tracking-wide ${apiStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                SYSTEM STATUS: {apiStatus === 'online' ? 'OPERATIONAL' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm backdrop-blur-sm">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          )}

     
        </div>

        {/* Scan Results */}
        {currentScan && (
          <div className="max-w-6xl mx-auto mb-20">
            {/* Risk Score Card */}
            <div className={`relative overflow-hidden rounded-2xl border ${
              currentScan.status === "Dangerous" 
                ? "bg-red-500/5 border-red-500/20" 
                : currentScan.status === "Warning" 
                ? "bg-yellow-500/5 border-yellow-500/20" 
                : "bg-green-500/5 border-green-500/20"
            } p-6 md:p-8 mb-8 backdrop-blur-sm transition-all duration-300`}>
              
              {/* Background Glow Effect */}
              <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
                 currentScan.status === "Dangerous" ? "bg-red-500" : currentScan.status === "Warning" ? "bg-yellow-500" : "bg-green-500"
              }`}></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8 md:gap-12">
                
                {/* Risk Score Circle */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative w-40 h-40 md:w-48 md:h-48">
                    {/* SVG Circle */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-800/50" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                        className={`${
                          currentScan.status === "Dangerous" ? "text-red-500" : currentScan.status === "Warning" ? "text-yellow-500" : "text-green-500"
                        } drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                        strokeDasharray={`${(currentScan.riskScore / 100) * 283} 283`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl md:text-6xl font-bold text-white tracking-tighter">{currentScan.riskScore}</span>
                      <span className="text-xs uppercase tracking-widest text-gray-400 mt-1">Risk Score</span>
                    </div>
                  </div>
                  
                   <div className={`mt-4 px-6 py-2 rounded-full text-sm font-bold tracking-wide uppercase ${
                      currentScan.status === "Dangerous" 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                        : currentScan.status === "Warning" 
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                   }`}>
                      {currentScan.status}
                   </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 w-full text-center lg:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 break-all">{currentScan.url}</h2>
                  
                  <p className={`text-lg mb-6 ${
                      currentScan.status === "Dangerous" 
                        ? "text-red-300" 
                        : currentScan.status === "Warning" 
                        ? "text-yellow-300" 
                        : "text-green-300"
                  }`}>
                      {currentScan.status === "Dangerous" 
                        ? "Strictly recommended to avoid this site. High threat level detected." 
                        : currentScan.status === "Warning"
                        ? "Potential security risks detected. Proceed with caution."
                        : "No major threats detected. Safe to browse."}
                  </p>
                  
                  {/* HTTP Warning */}
                  {currentScan.url.toLowerCase().startsWith('http://') && (
                     <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-4 text-left">
                        <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                        </div>
                        <div>
                           <h4 className="text-yellow-400 font-bold">Insecure Connection (HTTP)</h4>
                           <p className="text-yellow-200/80 text-sm mt-1">Data sent to this website is not encrypted and could be intercepted by attackers.</p>
                        </div>
                     </div>
                  )}

                   {/* Quick Stats Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
                      <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800">
                         <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Registrar</div>
                         <div className="text-white font-medium truncate">{currentScan.details?.registrar || 'Unknown'}</div>
                      </div>
                      <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800">
                         <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Created</div>
                         <div className="text-white font-medium">{currentScan.details?.creationDate || 'Unknown'}</div>
                      </div>
                        <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800 col-span-2 md:col-span-1">
                         <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Last Analysis</div>
                         <div className="text-white font-medium">{currentScan.details?.lastAnalysisDate}</div>
                      </div>
                   </div>
                </div>

              </div>
              
              {/* Action Buttons */}
               <div className="flex justify-center lg:justify-end gap-3 mt-8 pt-6 border-t border-gray-800/50">
                  <button className="px-6 py-2 rounded-lg bg-[#252a41] hover:bg-[#2f3552] text-white transition text-sm font-medium">
                    Reanalyze
                  </button>
                  <button className="px-6 py-2 rounded-lg bg-[#252a41] hover:bg-[#2f3552] text-white transition text-sm font-medium">
                    Detailed Report
                  </button>
               </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#1a1a2e]/60 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-xl mt-8">
              <div className="flex overflow-x-auto p-2 gap-2 border-b border-gray-800/50 bg-[#0f0f1e]/50 scrollbar-hide">
               {["detection", "explanation", "details", "relations", "community"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap outline-none focus:ring-2 focus:ring-[#7B83FF]/50 ${
                      activeTab === tab
                        ? "text-white bg-[#7B83FF] shadow-lg shadow-[#7B83FF]/25"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
               ))}
              </div>

              <div className="p-6 md:p-8 bg-gradient-to-b from-[#0a0a0f]/50 to-[#0a0a0f]">
                {activeTab === "detection" && (
                  <div>
                    <div className="grid grid-cols-1 gap-px bg-gray-800">
                      {/* Display only scanned URL and status */}
                      <div className="bg-[#0f0f1e] p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-white text-xs md:text-sm break-all">{currentScan.url}</span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
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
                  <div className="space-y-4 text-xs md:text-sm">
                    <div>
                      <h4 className="text-gray-400 mb-2 text-xs md:text-sm font-medium">WHOIS Information</h4>
                      <div className="bg-[#1a1a2e] p-3 md:p-4 rounded border border-gray-800 text-gray-300 font-mono text-xs overflow-x-auto">
                        {currentScan.details?.whoisInfo ? (
                          <pre className="text-xs">{JSON.stringify(currentScan.details.whoisInfo, null, 2)}</pre>
                        ) : (
                          <p className="text-xs text-center py-4">No WHOIS data available</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-400 mb-2 text-xs md:text-sm font-medium">DNS Records</h4>
                      <div className="bg-[#1a1a2e] p-3 md:p-4 rounded border border-gray-800 text-gray-300">
                        {currentScan.details?.dnsRecords ? (
                          <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(currentScan.details.dnsRecords, null, 2)}</pre>
                        ) : (
                          <p className="text-xs text-center py-4">No DNS records available</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-400 mb-2 text-xs md:text-sm font-medium">SSL Certificate</h4>
                      <div className="bg-[#1a1a2e] p-3 md:p-4 rounded border border-gray-800 text-gray-300">
                        {currentScan.details?.sslCertificates && !currentScan.details.sslCertificates.error ? (
                          <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(currentScan.details.sslCertificates, null, 2)}</pre>
                        ) : (
                          <p className="text-xs text-center py-4">
                            {currentScan.details?.sslCertificates?.error || "No SSL certificate data available"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "explanation" && (
                  <div className="space-y-8">
                    {loadingXAI ? (
                      <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className="relative w-16 h-16 mb-6">
                           <div className="absolute inset-0 border-t-2 border-[#7B83FF] rounded-full animate-spin"></div>
                           <div className="absolute inset-2 border-r-2 border-[#b19eef] rounded-full animate-spin-reverse"></div>
                        </div>
                        <p className="text-gray-400 font-mono text-sm tracking-wide animate-pulse">Initializing AI Analysis Protocol...</p>
                      </div>
                    ) : xaiExplanation ? (
                      <>
                       

                        {/* Strategic Recommendation Panel */}
                        <div className={`rounded-xl border border-gray-800 overflow-hidden ${
                          currentScan.riskScore >= 70
                            ? 'bg-red-950/10'
                            : currentScan.riskScore >= 40
                            ? 'bg-yellow-950/10'
                            : 'bg-green-950/10'
                        }`}>
                           <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                              <div className={`flex-shrink-0 p-4 rounded-xl border ${
                                 currentScan.riskScore >= 70 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                                 currentScan.riskScore >= 40 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 
                                 'bg-green-500/10 border-green-500/20 text-green-500'
                              }`}>
                                 {currentScan.riskScore >= 70 ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                                 ) : currentScan.riskScore >= 40 ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                 ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                                 )}
                              </div>
                              <div className="text-center md:text-left flex-1">
                                 <h4 className={`text-base font-mono uppercase tracking-widest mb-3 ${
                                    currentScan.riskScore >= 70 ? 'text-red-400' : 
                                    currentScan.riskScore >= 40 ? 'text-yellow-400' : 
                                    'text-green-400'
                                 }`}>
                                    Strategic Recommendation
                                 </h4>
                                 <p className="text-gray-200 text-sm md:text-lg font-medium">
                                    {xaiExplanation.recommendation}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Data Matrix */}
                        <div className={`grid gap-6 ${xaiExplanation.risk_factors?.length > 0 && xaiExplanation.positive_factors?.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                           
                           {/* Threat Vector Analysis */}
                           {xaiExplanation.risk_factors && xaiExplanation.risk_factors.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                                <h4 className="text-white font-bold text-lg">Threat Vectors Detected</h4>
                                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                  {xaiExplanation.risk_factors.length} ISSUES
                                </span>
                              </div>
                              
                              <div className="grid gap-3">
                                {xaiExplanation.risk_factors.map((factor: any, idx: number) => (
                                  <div key={idx} className="bg-[#1a1a2e] border border-red-500/20 rounded-lg p-4 hover:border-red-500/40 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <span className="flex-shrink-0 mt-1 text-red-500/50 group-hover:text-red-500 transition-colors font-mono text-xs">
                                           0{idx + 1}
                                        </span>
                                        <div>
                                           <h5 className="text-red-300 font-medium text-sm mb-1 group-hover:text-red-200 transition-colors">
                                             {factor.title}
                                           </h5>
                                           <p className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-400 transition-colors">
                                             {factor.description}
                                           </p>
                                        </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                           )}

                           {/* Trust Signal Analysis */}
                           {xaiExplanation.positive_factors && xaiExplanation.positive_factors.length > 0 && (
                            <div className="space-y-4">
                               <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                                <h4 className="text-white font-bold text-lg">Trust Signals Validated</h4>
                                <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                  {xaiExplanation.positive_factors.length} VERIFIED
                                </span>
                              </div>

                              <div className="grid gap-3">
                                {xaiExplanation.positive_factors.map((factor: any, idx: number) => (
                                  <div key={idx} className="bg-[#1a1a2e] border border-green-500/20 rounded-lg p-4 hover:border-green-500/40 transition-colors group">
                                     <div className="flex items-start gap-4">
                                        <span className="flex-shrink-0 mt-1 text-green-500/50 group-hover:text-green-500 transition-colors font-mono text-xs">
                                           0{idx + 1}
                                        </span>
                                        <div>
                                           <h5 className="text-green-300 font-medium text-sm mb-1 group-hover:text-green-200 transition-colors">
                                             {factor.title}
                                           </h5>
                                           <p className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-400 transition-colors">
                                             {factor.description}
                                           </p>
                                        </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                           )}
                           
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400">Unable to generate explanation. Please try again.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "relations" && (
                  <div>
                    {loadingHistory && (
                      <div className="text-center py-12">
                        <p className="text-gray-400">Loading historical data...</p>
                      </div>
                    )}
                    
                    {!loadingHistory && historicalData && (
                      <div className="space-y-6">
                        {/* JSON Data Sections - Improved Style */}
                        {historicalData.whois_changes && historicalData.whois_changes.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-2 text-white font-semibold mb-3 text-sm md:text-base">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7B83FF]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              WHOIS Changes History
                            </h4>
                            <div className="space-y-3">
                              {historicalData.whois_changes.map((change: any, idx: number) => (
                                <div key={idx} className="bg-[#1a1a2e]/50 border border-gray-800 rounded-xl p-4 transition-all hover:border-gray-700">
                                  <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                    <span className="text-gray-400 text-xs font-mono">
                                      {new Date(change.date).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {Object.entries(change.changes).map(([field, fieldChange]: [string, any]) => (
                                      <div key={field} className="text-sm border-l-2 border-gray-700 pl-3 py-1">
                                        <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{field}</div>
                                        <div className="flex flex-col gap-1 text-xs">
                                           <div className="flex items-center gap-2 text-red-400">
                                             <span className="w-4 inline-block font-mono">-</span>
                                             <span className="font-mono bg-red-500/10 px-1 rounded truncate max-w-full">{JSON.stringify(fieldChange.from).replace(/^"|"$/g, '')}</span>
                                           </div>
                                           <div className="flex items-center gap-2 text-green-400">
                                             <span className="w-4 inline-block font-mono">+</span>
                                             <span className="font-mono bg-green-500/10 px-1 rounded truncate max-w-full">{JSON.stringify(fieldChange.to).replace(/^"|"$/g, '')}</span>
                                           </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* DNS Changes Timeline */}
                        {historicalData.dns_changes && historicalData.dns_changes.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-2 text-white font-semibold mb-3 text-sm md:text-base">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#b19eef]"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                              DNS Changes History
                            </h4>
                            <div className="space-y-3">
                              {historicalData.dns_changes.map((change: any, idx: number) => (
                                <div key={idx} className="bg-[#1a1a2e]/50 border border-gray-800 rounded-xl p-4 transition-all hover:border-gray-700">
                                  <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                     <span className="text-gray-400 text-xs font-mono">
                                      {new Date(change.date).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {Object.entries(change.changes).map(([recordType, recordChange]: [string, any]) => (
                                      <div key={recordType} className="text-sm border-l-2 border-[#b19eef]/30 pl-3 py-1">
                                        <div className="text-[#b19eef] text-xs font-medium uppercase tracking-wider mb-1">{recordType} Records</div>
                                        
                                        {recordChange.added && recordChange.added.length > 0 && (
                                           <div className="flex flex-col gap-1 mb-1">
                                              {recordChange.added.map((val: string, vIdx: number) => (
                                                 <div key={vIdx} className="flex items-center gap-2 text-green-400 text-xs font-mono">
                                                   <span>+</span>
                                                   <span className="bg-green-500/10 px-1 rounded break-all">{val}</span>
                                                 </div>
                                              ))}
                                           </div>
                                        )}
                                        
                                        {recordChange.removed && recordChange.removed.length > 0 && (
                                           <div className="flex flex-col gap-1">
                                              {recordChange.removed.map((val: string, vIdx: number) => (
                                                 <div key={vIdx} className="flex items-center gap-2 text-red-400 text-xs font-mono">
                                                   <span>-</span>
                                                   <span className="bg-red-500/10 px-1 rounded break-all">{val}</span>
                                                 </div>
                                              ))}
                                           </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* SSL History */}
                        {historicalData.ssl_history && historicalData.ssl_history.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-2 text-white font-semibold mb-3 text-sm md:text-base">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                               SSL Certificate History
                            </h4>
                            <div className="space-y-3">
                              {historicalData.ssl_history.slice(0, 5).map((cert: any, idx: number) => (
                                <div key={idx} className="bg-[#1a1a2e]/50 border border-gray-800 rounded-xl p-4 transition-all hover:border-gray-700">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <span className="text-gray-400 text-xs font-mono">
                                      Captured: {new Date(cert.snapshot_date).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ml-0 md:ml-9">
                                    <div className="space-y-1">
                                      <div className="text-gray-500 uppercase tracking-widest text-[10px]">Issuer</div>
                                      <div className="text-gray-200 font-medium truncate" title={cert.issuer}>{cert.issuer}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-gray-500 uppercase tracking-widest text-[10px]">Serial Number</div>
                                      <div className="text-gray-200 font-mono truncate" title={cert.serial_number}>{cert.serial_number}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-gray-500 uppercase tracking-widest text-[10px]">Valid From</div>
                                      <div className="text-green-400 font-mono">{cert.valid_from}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-gray-500 uppercase tracking-widest text-[10px]">Valid Until</div>
                                      <div className="text-yellow-400 font-mono">{cert.valid_until}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Empty State */}
                        {(!historicalData.whois_changes || historicalData.whois_changes.length === 0) &&
                         (!historicalData.dns_changes || historicalData.dns_changes.length === 0) &&
                         (!historicalData.ssl_history || historicalData.ssl_history.length === 0) && (
                          <div className="text-center py-12">
                            <p className="text-gray-400">No historical changes detected yet.</p>
                            <p className="text-gray-500 text-sm mt-2">
                              Changes will appear as we track this domain over time.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "community" && (
                  <div className="py-12 max-w-2xl mx-auto">
                    <h3 className="text-white font-semibold mb-4 text-center">Community Feedback</h3>
                    {loadingComments ? (
                      <div className="text-gray-400 text-center mb-6">Loading feedback...</div>
                    ) : (
                      <>
                        {communityComments.length === 0 ? (
                          <div className="text-gray-400 text-center mb-6">No feedback yet. Be the first to share your assessment!</div>
                        ) : (
                          <ul className="mb-6 space-y-4">
                            {communityComments.map((cmt, idx) => (
                              <li key={idx} className="bg-[#1a1a2e]/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-[#7B83FF]/30 transition-all">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7B83FF] to-[#b19eef] p-0.5">
                                      <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center">
                                         <span className="text-[10px] font-bold text-white">{cmt.user_id ? cmt.user_id.substring(0, 2).toUpperCase() : "AN"}</span>
                                      </div>
                                    </div>
                                    <div>
                                       <div className="text-xs text-gray-400">User: {cmt.user_id ? `${cmt.user_id.substring(0, 8)}...` : "Anonymous"}</div>
                                       <div className="text-[10px] text-gray-500">{cmt.created_at ? new Date(cmt.created_at).toLocaleString() : ""}</div>
                                    </div>
                                  </div>
                                  {cmt.flag && cmt.flag !== 'neutral' && (
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                                       cmt.flag === 'legitimate' 
                                          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}>
                                      {cmt.flag === 'legitimate' ? (
                                        <>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                          <span className="text-[10px] font-bold uppercase tracking-wider">Legitimate</span>
                                        </>
                                      ) : cmt.flag === 'phishing' ? (
                                        <>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                          <span className="text-[10px] font-bold uppercase tracking-wider">Phishing</span>
                                        </>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-200 leading-relaxed pl-11">{cmt.description}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                    
                    {commentError && (
                      <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300 text-sm">
                        {commentError}
                      </div>
                    )}
                    
                    {commentSuccess && (
                      <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-300 text-sm">
                        Thank you! Your feedback has been recorded.
                      </div>
                    )}
                    
                    <div className="mt-8 pt-8 border-t border-gray-800/50">
                      <label className="text-white font-semibold text-sm mb-4 block flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7B83FF]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Share Your Assessment
                      </label>
                      <div className="bg-[#1a1a2e]/60 border border-gray-700/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#7B83FF]/50 transition-all">
                        <textarea
                           placeholder="Share your experience or findings about this URL..."
                           className="w-full bg-transparent border-none p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0 text-sm resize-none"
                           rows={4}
                           value={commentInput}
                           onChange={e => setCommentInput(e.target.value)}
                           disabled={submittingComment}
                        />
                         <div className="bg-[#0f0f1e]/50 px-4 py-3 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                           <div className="flex gap-2 w-full sm:w-auto">
                              {[
                                 { id: 'legitimate', label: 'Legitimate', color: 'green' },
                                 { id: 'phishing', label: 'Phishing', color: 'red' },
                                 { id: 'neutral', label: 'Unsure', color: 'gray' }
                              ].map((option) => (
                                 <button
                                    key={option.id}
                                    onClick={() => setSelectedFlag(option.id as any)}
                                    disabled={submittingComment}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                       selectedFlag === option.id
                                          ? option.color === 'green' ? 'bg-green-500/10 border-green-500 text-green-400' :
                                            option.color === 'red' ? 'bg-red-500/10 border-red-500 text-red-400' :
                                            'bg-gray-500/10 border-gray-400 text-gray-300'
                                          : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                    }`}
                                 >
                                    {option.label}
                                 </button>
                              ))}
                           </div>
                           <button
                              className="bg-[#545BFF] hover:bg-[#4349dd] text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[#545BFF]/20 disabled:opacity-50 w-full sm:w-auto"
                              onClick={handleSubmitComment}
                              disabled={submittingComment || !commentInput.trim()}
                           >
                              {submittingComment ? "Sending..." : "Post Comment"}
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans Table */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#7B83FF]/10 rounded-lg">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B83FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
               </svg>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Recent Activity</h2>
          </div>

          <div className="bg-[#1a1a2e]/40 backdrop-blur-md border border-gray-800/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-800/50 bg-[#0f0f1e]/30">
                  <th className="text-left px-6 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">URL / Domain</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="text-right px-6 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Risk Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {recentScans.length > 0 ? (
                  recentScans.slice(0, 10).map((scan, index) => (
                    <tr 
                      key={index} 
                      className="group hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer" 
                      onClick={() => setCurrentScan(scan)}
                    >
                      <td className="px-6 py-4 text-gray-300 text-sm break-all max-w-[300px]">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              scan.status === 'Dangerous' ? 'bg-red-500' : scan.status === 'Warning' ? 'bg-yellow-500' : 'bg-green-500'
                           }`}></div>
                           <span className="group-hover:text-white transition-colors">{scan.url}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap font-mono">{scan.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-gray-400 text-sm font-mono">{scan.riskScore}%</span>
                          <span className={`${
                            scan.status === "Dangerous" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            scan.status === "Warning" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                            "bg-green-500/10 text-green-500 border-green-500/20"
                          } text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap uppercase tracking-wide`}>
                            {scan.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <p>No scans yet. Enter a URL above to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Background blend */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-0"></div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 bg-[#0a0a0f] py-12 px-6 mt-20">
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

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f0f1e] border border-gray-800 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[#7B83FF]/10 border border-[#7B83FF]/30 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7B83FF]">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-400 text-sm">
                  Are you sure you want to log out of SmartShield? Your scan history will be saved.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#1a1a2e] border border-gray-700 text-white rounded-lg hover:bg-[#252540] hover:border-gray-600 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await signOut()
                  redirect("/login")
                }}
                className="flex-1 px-4 py-2.5 bg-[#7B83FF] text-white rounded-lg hover:bg-[#6B73E8] transition font-medium text-sm flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}