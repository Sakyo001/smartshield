"use client";

import { useEffect, useState } from "react";

const COOKIE_KEY = "smartshield_cookie_consent";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: true,
    functional: true,
    marketing: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_KEY);
      if (!saved) {
        // Slight delay so it doesn't flash immediately on page load
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (c: ConsentState) => {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...c, date: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  const acceptAll = () =>
    save({ necessary: true, analytics: true, functional: true, marketing: true });

  const rejectAll = () =>
    save({ necessary: true, analytics: false, functional: false, marketing: false });

  const savePreferences = () => save(consent);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[#0d0d14] border border-white/10 rounded-2xl shadow-[0_-4px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Main Row */}
        <div className="px-5 py-5 md:px-6">
          <div className="flex items-start gap-4">
            {/* Cookie icon */}
            <div className="w-10 h-10 rounded-full bg-[#545BFF]/15 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#545BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8.5 8.5v.01M16 8.5v.01M12 7v.01M7 12v.01M17 12v.01M12 17v.01M9 15v.01M15 15v.01" strokeWidth="2.5" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base mb-1">We use cookies 🍪</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                SmartShield uses cookies to enhance your experience, analyze site performance, and deliver relevant features.
                Your privacy is important to us — you control what we collect.{" "}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[#545BFF] hover:text-[#7b82ff] underline underline-offset-2 transition-colors"
                >
                  {showDetails ? "Hide details" : "Manage preferences"}
                </button>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-6 h-10 bg-[#545BFF] hover:bg-[#4349dd] text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-[0_0_15px_rgba(84,91,255,0.3)]"
            >
              Accept All
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 sm:flex-none px-6 h-10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium rounded-full border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 sm:flex-none px-6 h-10 text-gray-400 hover:text-white text-sm font-medium rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              {showDetails ? "Hide" : "Customize"}
            </button>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="border-t border-white/10 px-5 py-5 md:px-6 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">Cookie Categories</p>

            {/* Necessary */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/3 border border-white/5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">Strictly Necessary</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium border border-green-500/20">Always On</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">Essential for the website to function. Includes session management, authentication tokens, and security cookies. Cannot be disabled.</p>
              </div>
              <div className="shrink-0 mt-0.5">
                <div className="w-10 h-5 rounded-full bg-[#545BFF]/30 border border-[#545BFF]/50 flex items-center justify-end px-0.5 cursor-not-allowed opacity-60">
                  <div className="w-4 h-4 rounded-full bg-[#545BFF]"></div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <ToggleRow
              label="Analytics & Performance"
              description="Helps us understand how visitors interact with SmartShield — page views, session duration, and feature usage — so we can improve the experience."
              checked={consent.analytics}
              onChange={(v) => setConsent({ ...consent, analytics: v })}
            />

            {/* Functional */}
            <ToggleRow
              label="Functional"
              description="Enables enhanced features and personalization, such as remembering your theme preference, recent scans, and UI settings across sessions."
              checked={consent.functional}
              onChange={(v) => setConsent({ ...consent, functional: v })}
            />

            {/* Marketing */}
            <ToggleRow
              label="Marketing & Targeting"
              description="Used to deliver relevant content and measure the effectiveness of our promotional communications. We do not sell your data to advertisers."
              checked={consent.marketing}
              onChange={(v) => setConsent({ ...consent, marketing: v })}
            />

            <div className="pt-2">
              <button
                onClick={savePreferences}
                className="w-full sm:w-auto px-8 h-10 bg-[#545BFF] hover:bg-[#4349dd] text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-[0_0_15px_rgba(84,91,255,0.3)]"
              >
                Save My Preferences
              </button>
            </div>
          </div>
        )}

        {/* Legal footer */}
        <div className="px-5 pb-4 md:px-6">
          <p className="text-gray-600 text-xs">
            By continuing to use SmartShield, you acknowledge our use of cookies.
            See our{" "}
            <a href="/privacy-policy" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>{" "}
            for full details.
          </p>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/3 border border-white/5">
      <div className="flex-1">
        <p className="text-white text-sm font-medium mb-1">{label}</p>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`shrink-0 mt-0.5 w-10 h-5 rounded-full border flex items-center px-0.5 transition-all duration-200 ${
          checked
            ? "bg-[#545BFF]/30 border-[#545BFF]/50 justify-end"
            : "bg-white/5 border-white/10 justify-start"
        }`}
        aria-label={`Toggle ${label}`}
      >
        <div
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            checked ? "bg-[#545BFF]" : "bg-gray-500"
          }`}
        />
      </button>
    </div>
  );
}
