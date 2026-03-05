"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@lib/auth-context";
import { getTodaysScans } from "@lib/supabase";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ScanResult {
  url: string;
  riskScore: number;
  status: "Safe" | "Warning" | "Dangerous";
  date: string;
  details?: {
    registrar?: string;
    creationDate?: string;
    lastAnalysisDate?: string;
    detections?: Array<{ service: string; category: string; result: string }>;
    whoisInfo?: any;
    dnsRecords?: any;
    sslCertificates?: any;
    communityComments?: number;
    riskAdjustment?: any;
  };
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
async function fetchWithTimeout(resource: RequestInfo, options: any = {}) {
  const { timeout = 30000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") throw new Error("Request timeout – API is taking too long to respond");
    throw error;
  }
}

/* ─────────────────────────────────────────────
   Guest Scanner (no auth required)
───────────────────────────────────────────── */
function GuestScanner() {
  const WHOIS_API_URL = process.env.NEXT_PUBLIC_WHOIS_API_URL;

  const [urlInput, setUrlInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [activeTab, setActiveTab] = useState<"detection" | "explanation" | "details" | "relations" | "community">("detection");

  // XAI explanation
  const [xaiExplanation, setXaiExplanation] = useState<any>(null);
  const [loadingXAI, setLoadingXAI] = useState(false);

  // Relations / history
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Community (read-only for guests)
  const [communityComments, setCommunityComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  /* API health check */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${WHOIS_API_URL}/health`).catch(() => null);
        setApiStatus(res?.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    })();
  }, []);

  /* Fetch XAI explanation whenever currentScan changes */
  useEffect(() => {
    if (!currentScan) return;
    setXaiExplanation(null);
    setHistoricalData(null);
    setLoadingXAI(true);

    (async () => {
      try {
        const res = await fetch(`${WHOIS_API_URL}/api/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: currentScan.url,
            scan_result: {
              riskScore: currentScan.riskScore,
              decision: currentScan.status,
              detections: currentScan.details?.detections || [],
            },
            whois_info: currentScan.details?.whoisInfo || {},
            dns_info: currentScan.details?.dnsRecords || {},
            ssl_info: currentScan.details?.sslCertificates || {},
            deterministic_flags: currentScan.details?.riskAdjustment?.deterministic_flags || [],
          }),
        });
        if (res.ok) setXaiExplanation(await res.json());
      } catch {
        /* ignore */
      } finally {
        setLoadingXAI(false);
      }
    })();
  }, [currentScan]);

  /* Fetch community comments when tab active */
  useEffect(() => {
    if (activeTab !== "community" || !currentScan) return;
    setLoadingComments(true);
    (async () => {
      try {
        const res = await fetch(`${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(currentScan.url)}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityComments(data.reports || []);
        } else {
          setCommunityComments([]);
        }
      } catch {
        setCommunityComments([]);
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [activeTab, currentScan]);

  /* Fetch relations / history when tab active */
  useEffect(() => {
    if (activeTab !== "relations" || !currentScan || historicalData || loadingHistory) return;
    setLoadingHistory(true);
    (async () => {
      try {
        const res = await fetchWithTimeout(`${WHOIS_API_URL}/api/domain-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentScan.url }),
          timeout: 15000,
        });
        if (res.ok) setHistoricalData(await res.json());
      } catch {
        /* ignore */
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [activeTab, currentScan]);

  /* Core scan logic */
  const doScan = async (url: string) => {
    setScanning(true);
    setError(null);
    setCurrentScan(null);
    setUrlInput(url);

    try {
      const response = await fetchWithTimeout(`${WHOIS_API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        timeout: 45000,
      });

      if (!response.ok) throw new Error("Failed to scan URL");

      const data = await response.json();

      let whoisInfo = data.whois || null;
      let dnsRecords = data.dns || null;
      let sslInfo = data.ssl || null;
      let riskAdjustment = data.risk_adjustment || null;

      let riskScore = 0;
      let status: "Safe" | "Warning" | "Dangerous" = "Safe";

      if (data.decision === "PHISHING") {
        riskScore = Math.round(data.confidence || 100);
      } else if (data.decision === "LEGITIMATE") {
        riskScore = Math.round(100 - (data.confidence || 0));
      } else {
        riskScore = Math.round(data.score * 100 || 0);
      }

      if (riskScore >= 70) status = "Dangerous";
      else if (riskScore >= 40) status = "Warning";

      if (url.toLowerCase().startsWith("http://") && riskScore < 40) {
        riskScore = 40;
        status = "Warning";
      }

      if (riskAdjustment) {
        const deterministicIncrease = riskAdjustment.deterministic_increase || 0;
        const contextualReduction = riskAdjustment.reduction_percentage || 0;
        const indicators = riskAdjustment.indicators || [];

        const criticalIndicators = indicators.filter(
          (i: string) => typeof i === "string" && (i.includes("CRITICAL") || i.includes("🚨"))
        );

        if (criticalIndicators.length > 0) {
          riskScore = 100;
          status = "Dangerous";
        } else {
          riskScore = riskScore + deterministicIncrease - contextualReduction;
          riskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

          const hasWhoisWarning = indicators.some(
            (i: string) => typeof i === "string" && i.includes("WHOIS Information Unavailable") && !i.includes("CRITICAL")
          );
          if (hasWhoisWarning && riskScore < 45) riskScore = 45;

          if (riskScore >= 70) status = "Dangerous";
          else if (riskScore >= 40) status = "Warning";
          else status = "Safe";
        }
      }

      setCurrentScan({
        url,
        riskScore,
        status,
        date: new Date().toLocaleString(),
        details: {
          registrar: whoisInfo?.registrar || "N/A",
          creationDate: whoisInfo?.creation_date || "N/A",
          lastAnalysisDate: new Date().toLocaleDateString(),
          detections: data.detections || [],
          whoisInfo,
          dnsRecords,
          sslCertificates: sslInfo,
          communityComments: data.community_comments || 0,
          riskAdjustment,
        },
      });

      setActiveTab("detection");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while scanning");
    } finally {
      setScanning(false);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    doScan(urlInput);
  };

  const handleReanalyze = () => {
    if (!currentScan) return;
    doScan(currentScan.url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6B73FF]/10 border border-[#6B73FF]/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
          <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">Guest Mode</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Try SmartShield – No Account Needed</h2>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Scan any URL instantly. Results are not saved.{" "}
          <Link href="/signup" className="text-[#6B73FF] hover:underline font-medium">Create a free account</Link>
          {" "}to save your history.
        </p>
      </div>

      {/* Scan Form */}
      <form onSubmit={handleScan} className="relative group z-20 mb-4">
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-[#545BFF] to-[#b19eef] rounded-xl opacity-30 blur transition duration-1000 group-hover:opacity-60 pointer-events-none ${
            scanning ? "animate-pulse" : ""
          }`}
        ></div>
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
            className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
              scanning
                ? "bg-gray-800 text-gray-400 cursor-wait"
                : "bg-[#545BFF] hover:bg-[#4349dd] text-white shadow-lg shadow-[#545BFF]/20 hover:shadow-[#545BFF]/40"
            }`}
          >
            {scanning ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Scan Now</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* API Status */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#1a1a2e]/60 border border-gray-700/50 rounded-full backdrop-blur-sm">
          <div className="relative flex h-2.5 w-2.5">
            {apiStatus === "online" ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            )}
          </div>
          <span className={`text-xs font-medium tracking-wide ${apiStatus === "online" ? "text-green-400" : "text-red-400"}`}>
            SYSTEM STATUS: {apiStatus === "online" ? "OPERATIONAL" : apiStatus === "checking" ? "CHECKING..." : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      {/* Scan Results */}
      {currentScan && (
        <div className="mt-4">
          {/* Risk Score Card */}
          <div
            className={`relative overflow-hidden rounded-2xl border ${
              currentScan.status === "Dangerous"
                ? "bg-red-500/5 border-red-500/20"
                : currentScan.status === "Warning"
                ? "bg-yellow-500/5 border-yellow-500/20"
                : "bg-green-500/5 border-green-500/20"
            } p-6 md:p-8 mb-8 backdrop-blur-sm`}
          >
            {/* Glow */}
            <div
              className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
                currentScan.status === "Dangerous" ? "bg-red-500" : currentScan.status === "Warning" ? "bg-yellow-500" : "bg-green-500"
              }`}
            ></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8 md:gap-12">
              {/* Risk Circle */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="relative w-40 h-40 md:w-48 md:h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-800/50" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                      className={currentScan.status === "Dangerous" ? "text-red-500" : currentScan.status === "Warning" ? "text-yellow-500" : "text-green-500"}
                      strokeDasharray={`${(currentScan.riskScore / 100) * 283} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-bold text-white tracking-tighter">{currentScan.riskScore}</span>
                    <span className="text-xs uppercase tracking-widest text-gray-400 mt-1">Risk Score</span>
                  </div>
                </div>
                <div
                  className={`mt-4 px-6 py-2 rounded-full text-sm font-bold tracking-wide uppercase ${
                    currentScan.status === "Dangerous"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : currentScan.status === "Warning"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                >
                  {currentScan.status}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 w-full text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 break-all">{currentScan.url}</h2>
                <p
                  className={`text-lg mb-6 ${
                    currentScan.status === "Dangerous" ? "text-red-300" : currentScan.status === "Warning" ? "text-yellow-300" : "text-green-300"
                  }`}
                >
                  {currentScan.status === "Dangerous"
                    ? "Strictly recommended to avoid this site. High threat level detected."
                    : currentScan.status === "Warning"
                    ? "Potential security risks detected. Proceed with caution."
                    : "No major threats detected. Safe to browse."}
                </p>

                {/* HTTP Warning */}
                {currentScan.url.toLowerCase().startsWith("http://") && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-4 text-left">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-bold">Insecure Connection (HTTP)</h4>
                      <p className="text-yellow-200/80 text-sm mt-1">Data sent to this website is not encrypted and could be intercepted by attackers.</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Registrar</div>
                    <div className="text-white font-medium truncate">{currentScan.details?.registrar || "Unknown"}</div>
                  </div>
                  <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Created</div>
                    <div className="text-white font-medium">{currentScan.details?.creationDate || "Unknown"}</div>
                  </div>
                  <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800 col-span-2 md:col-span-1">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Last Analysis</div>
                    <div className="text-white font-medium">{currentScan.details?.lastAnalysisDate}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reanalyze + signup nudge */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-800/50">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B73FF]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span>Results not saved.</span>
                <Link href="/signup" className="text-[#6B73FF] hover:underline font-medium">Sign up to save history →</Link>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={scanning}
                className="px-6 py-2 rounded-lg bg-[#252a41] hover:bg-[#2f3552] disabled:opacity-50 disabled:cursor-not-allowed text-white transition text-sm font-medium"
              >
                {scanning ? "Scanning..." : "Reanalyze"}
              </button>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="bg-[#1a1a2e]/60 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex overflow-x-auto p-2 gap-2 border-b border-gray-800/50 bg-[#0f0f1e]/50 scrollbar-hide">
              {(["detection", "explanation", "details", "relations", "community"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap outline-none focus:ring-2 focus:ring-[#7B83FF]/50 ${
                    activeTab === tab ? "text-white bg-[#7B83FF] shadow-lg shadow-[#7B83FF]/25" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-b from-[#0a0a0f]/50 to-[#0a0a0f]">

              {/* ── Detection ── */}
              {activeTab === "detection" && (
                <div>
                  <div className="grid grid-cols-1 gap-px bg-gray-800">
                    <div className="bg-[#0f0f1e] p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-white text-xs md:text-sm break-all">{currentScan.url}</span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                          currentScan.riskScore >= 70
                            ? "bg-red-500/20 text-red-400"
                            : currentScan.riskScore >= 40
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {currentScan.riskScore >= 70 ? "Phishing" : currentScan.riskScore >= 40 ? "Suspicious" : "Safe"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Details ── */}
              {activeTab === "details" && (
                <div className="space-y-4 text-xs md:text-sm">
                  <div>
                    <h4 className="text-gray-400 mb-2 font-medium">WHOIS Information</h4>
                    <div className="bg-[#1a1a2e] p-3 md:p-4 rounded border border-gray-800 text-gray-300 font-mono text-xs overflow-x-auto">
                      {currentScan.details?.whoisInfo ? (
                        <pre className="text-xs">{JSON.stringify(currentScan.details.whoisInfo, null, 2)}</pre>
                      ) : (
                        <p className="text-xs text-center py-4">No WHOIS data available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-400 mb-2 font-medium">DNS Records</h4>
                    <div className="bg-[#1a1a2e] p-3 md:p-4 rounded border border-gray-800 text-gray-300">
                      {currentScan.details?.dnsRecords ? (
                        <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(currentScan.details.dnsRecords, null, 2)}</pre>
                      ) : (
                        <p className="text-xs text-center py-4">No DNS records available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-400 mb-2 font-medium">SSL Certificate</h4>
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

              {/* ── Explanation ── */}
              {activeTab === "explanation" && (
                <div className="space-y-8">
                  {loadingXAI ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                      <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-t-2 border-[#7B83FF] rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-r-2 border-[#b19eef] rounded-full animate-spin" style={{ animationDirection: "reverse" }}></div>
                      </div>
                      <p className="text-gray-400 font-mono text-sm tracking-wide animate-pulse">Initializing AI Analysis Protocol...</p>
                    </div>
                  ) : xaiExplanation ? (
                    <>
                      {/* Recommendation */}
                      <div
                        className={`rounded-xl border border-gray-800 overflow-hidden ${
                          currentScan.riskScore >= 70 ? "bg-red-950/10" : currentScan.riskScore >= 40 ? "bg-yellow-950/10" : "bg-green-950/10"
                        }`}
                      >
                        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                          <div
                            className={`flex-shrink-0 p-4 rounded-xl border ${
                              currentScan.riskScore >= 70
                                ? "bg-red-500/10 border-red-500/20 text-red-500"
                                : currentScan.riskScore >= 40
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                : "bg-green-500/10 border-green-500/20 text-green-500"
                            }`}
                          >
                            {currentScan.riskScore >= 70 ? (
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                            ) : currentScan.riskScore >= 40 ? (
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                            ) : (
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                            )}
                          </div>
                          <div className="text-center md:text-left flex-1">
                            <h4
                              className={`text-base font-mono uppercase tracking-widest mb-3 ${
                                currentScan.riskScore >= 70 ? "text-red-400" : currentScan.riskScore >= 40 ? "text-yellow-400" : "text-green-400"
                              }`}
                            >
                              Strategic Recommendation
                            </h4>
                            <p className="text-gray-200 text-sm md:text-lg font-medium">{xaiExplanation.recommendation}</p>
                          </div>
                        </div>
                      </div>

                      {/* Factors Grid */}
                      <div
                        className={`grid gap-6 ${
                          xaiExplanation.risk_factors?.length > 0 && xaiExplanation.positive_factors?.length > 0
                            ? "grid-cols-1 lg:grid-cols-2"
                            : "grid-cols-1"
                        }`}
                      >
                        {xaiExplanation.risk_factors?.length > 0 && (
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
                                    <span className="flex-shrink-0 mt-1 text-red-500/50 group-hover:text-red-500 transition-colors font-mono text-xs">0{idx + 1}</span>
                                    <div>
                                      <h5 className="text-red-300 font-medium text-sm mb-1">{factor.title}</h5>
                                      <p className="text-gray-500 text-xs leading-relaxed">{factor.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {xaiExplanation.positive_factors?.length > 0 && (
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
                                    <span className="flex-shrink-0 mt-1 text-green-500/50 group-hover:text-green-500 transition-colors font-mono text-xs">0{idx + 1}</span>
                                    <div>
                                      <h5 className="text-green-300 font-medium text-sm mb-1">{factor.title}</h5>
                                      <p className="text-gray-500 text-xs leading-relaxed">{factor.description}</p>
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

              {/* ── Relations ── */}
              {activeTab === "relations" && (
                <div>
                  {loadingHistory && (
                    <div className="text-center py-12">
                      <p className="text-gray-400">Loading historical data...</p>
                    </div>
                  )}
                  {!loadingHistory && historicalData && (
                    <div className="space-y-6">
                      {historicalData.whois_changes?.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-white font-semibold mb-3 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7B83FF]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            WHOIS Changes History
                          </h4>
                          <div className="space-y-3">
                            {historicalData.whois_changes.map((change: any, idx: number) => (
                              <div key={idx} className="bg-[#1a1a2e]/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                                <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                  <span className="text-gray-400 text-xs font-mono">{new Date(change.date).toLocaleString()}</span>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(change.changes).map(([field, fieldChange]: [string, any]) => (
                                    <div key={field} className="text-sm border-l-2 border-gray-700 pl-3 py-1">
                                      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{field}</div>
                                      <div className="flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-2 text-red-400"><span className="w-4 font-mono">-</span><span className="font-mono bg-red-500/10 px-1 rounded truncate">{JSON.stringify(fieldChange.from).replace(/^"|"$/g, "")}</span></div>
                                        <div className="flex items-center gap-2 text-green-400"><span className="w-4 font-mono">+</span><span className="font-mono bg-green-500/10 px-1 rounded truncate">{JSON.stringify(fieldChange.to).replace(/^"|"$/g, "")}</span></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {historicalData.dns_changes?.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-white font-semibold mb-3 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#b19eef]"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            DNS Changes History
                          </h4>
                          <div className="space-y-3">
                            {historicalData.dns_changes.map((change: any, idx: number) => (
                              <div key={idx} className="bg-[#1a1a2e]/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                                <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                  <span className="text-gray-400 text-xs font-mono">{new Date(change.date).toLocaleString()}</span>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(change.changes).map(([recordType, recordChange]: [string, any]) => (
                                    <div key={recordType} className="text-sm border-l-2 border-[#b19eef]/30 pl-3 py-1">
                                      <div className="text-[#b19eef] text-xs font-medium uppercase tracking-wider mb-1">{recordType} Records</div>
                                      {recordChange.added?.map((val: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-green-400 text-xs font-mono"><span>+</span><span className="bg-green-500/10 px-1 rounded break-all">{val}</span></div>
                                      ))}
                                      {recordChange.removed?.map((val: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-red-400 text-xs font-mono"><span>-</span><span className="bg-red-500/10 px-1 rounded break-all">{val}</span></div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {historicalData.ssl_history?.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-white font-semibold mb-3 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            SSL Certificate History
                          </h4>
                          <div className="space-y-3">
                            {historicalData.ssl_history.slice(0, 5).map((cert: any, idx: number) => (
                              <div key={idx} className="bg-[#1a1a2e]/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1.5 bg-green-500/10 rounded-lg">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                  </div>
                                  <span className="text-gray-400 text-xs font-mono">Captured: {new Date(cert.snapshot_date).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ml-9">
                                  <div><div className="text-gray-500 uppercase tracking-widest text-[10px]">Issuer</div><div className="text-gray-200 font-medium truncate">{cert.issuer}</div></div>
                                  <div><div className="text-gray-500 uppercase tracking-widest text-[10px]">Serial Number</div><div className="text-gray-200 font-mono truncate">{cert.serial_number}</div></div>
                                  <div><div className="text-gray-500 uppercase tracking-widest text-[10px]">Valid From</div><div className="text-green-400 font-mono">{cert.valid_from}</div></div>
                                  <div><div className="text-gray-500 uppercase tracking-widest text-[10px]">Valid Until</div><div className="text-yellow-400 font-mono">{cert.valid_until}</div></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!historicalData.whois_changes?.length && !historicalData.dns_changes?.length && !historicalData.ssl_history?.length) && (
                        <div className="text-center py-12">
                          <p className="text-gray-400">No historical changes detected yet.</p>
                          <p className="text-gray-500 text-sm mt-2">Changes will appear as we track this domain over time.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!loadingHistory && !historicalData && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-sm">No historical data available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Community ── */}
              {activeTab === "community" && (
                <div className="py-6 max-w-2xl mx-auto">
                  <h3 className="text-white font-semibold mb-4 text-center">Community Feedback</h3>

                  {loadingComments ? (
                    <div className="text-gray-400 text-center mb-6">Loading feedback...</div>
                  ) : communityComments.length === 0 ? (
                    <div className="text-gray-400 text-center mb-6">No feedback yet for this URL.</div>
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
                            {cmt.flag && cmt.flag !== "neutral" && (
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                                  cmt.flag === "legitimate" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}
                              >
                                {cmt.flag === "legitimate" ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Legitimate</span>
                                  </>
                                ) : (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Phishing</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-200 leading-relaxed pl-11">{cmt.description}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Guest CTA */}
                  <div className="mt-6 p-5 bg-[#1a1a2e]/60 border border-[#6B73FF]/20 rounded-xl text-center">
                    <div className="w-10 h-10 rounded-full bg-[#6B73FF]/10 flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B73FF" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Want to share your assessment?</p>
                    <p className="text-gray-500 text-xs mb-4">Create a free account to post community feedback and flag URLs.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/signup" className="bg-[#6B73FF] hover:bg-[#5a62ff] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-[#6B73FF]/20">
                        Create Account
                      </Link>
                      <Link href="/login" className="bg-[#1a1a2e] hover:bg-[#212136] text-[#6B73FF] border border-[#6B73FF]/40 px-6 py-2.5 rounded-lg text-sm font-semibold transition">
                        Sign In
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ScanTab – root export
   · Guest:       full scanner (GuestScanner)
   · Logged-in:   recent scan history
───────────────────────────────────────────── */
export default function ScanTab() {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getTodaysScans(user.id)
        .then((scans) => {
          setRecentScans(scans as any);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  /* ── No user → show guest scanner ── */
  if (!user) return <GuestScanner />;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0f0f1e] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#6B73FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your scans...</p>
        </div>
      </div>
    );
  }

  /* ── Logged-in: recent scans ── */
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Your Recent Scans</h2>
        <p className="text-gray-400">Track your URL scanning history and security analysis results</p>
      </div>

      {recentScans.length > 0 ? (
        <div className="bg-[#0f0f1e] rounded-2xl overflow-hidden shadow-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0a0a0f]">
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                    URL / Domain
                  </th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                    Risk Analysis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentScans.slice(0, 10).map((scan, index) => (
                  <tr
                    key={index}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-gray-100 text-sm">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            scan.status === "Dangerous"
                              ? "bg-red-500"
                              : scan.status === "Warning"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <span className="break-all max-w-[400px]">{scan.url}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                      {scan.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-gray-400 text-sm font-mono">
                          {(scan as any).riskScore ?? (scan as any).confidence}%
                        </span>
                        <span
                          className={`${
                            scan.status === "Dangerous"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : scan.status === "Warning"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          } text-xs px-3 py-1 rounded-full border font-medium uppercase tracking-wide`}
                        >
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
      ) : (
        <div className="bg-[#0f0f1e] rounded-2xl p-16 text-center shadow-lg border border-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No scans yet
          </h3>
          <p className="text-gray-400 mb-6">
            Start protecting yourself by scanning your first URL
          </p>
          <Link
            href={`/dashboard/${user.id}`}
            className="inline-block bg-[#6B73FF] hover:bg-[#5a62ff] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#6B73FF]/30"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
