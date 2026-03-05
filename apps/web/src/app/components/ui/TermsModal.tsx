"use client";

import { useEffect, useState } from "react";

const TERMS_KEY = "smartshield_terms_accepted";

export default function TermsModal() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(TERMS_KEY);
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (!checked) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    try {
      localStorage.setItem(TERMS_KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(84,91,255,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#545BFF]/20 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#545BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-none">Terms & Conditions</h2>
            <p className="text-gray-400 text-xs mt-1">Please read and accept before continuing</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 text-gray-300 text-sm leading-relaxed space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Last updated: March 6, 2026</p>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">1. Acceptance of Terms</h3>
            <p>By accessing or using SmartShield ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not access or use the Service.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">2. Description of Service</h3>
            <p>SmartShield is an AI-powered phishing and threat detection platform. We provide real-time URL scanning, risk assessment, and security analytics to help users identify potentially malicious websites. The Service is provided for informational and security purposes only and does not constitute legal, professional, or security advice.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">3. User Responsibilities</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>You must be at least 13 years old to use the Service.</li>
              <li>You agree not to use the Service for any unlawful or harmful purpose.</li>
              <li>You agree not to attempt to reverse-engineer, scrape, or abuse our APIs or infrastructure.</li>
              <li>You are solely responsible for the URLs, data, or content you submit for scanning.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">4. Accuracy of Results</h3>
            <p>SmartShield uses machine learning models to assess risk. While we strive for accuracy, no system is perfect. Scan results are probabilistic and should not be the sole basis for security decisions. We make no warranties, express or implied, regarding the completeness or reliability of scan results.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">5. Intellectual Property</h3>
            <p>All content, logos, trademarks, and software associated with SmartShield are the property of SmartShield and its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">6. Privacy & Data</h3>
            <p>We collect and process data as described in our Privacy Policy. By using the Service, you consent to our data practices. URLs submitted for scanning may be stored to improve our detection models. We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">7. Limitation of Liability</h3>
            <p>To the maximum extent permitted by law, SmartShield and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Service, even if advised of the possibility of such damages.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">8. Modifications</h3>
            <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes your acceptance of the revised Terms. We will attempt to notify users of significant changes via the Service.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">9. Termination</h3>
            <p>We reserve the right to suspend or terminate your access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">10. Governing Law</h3>
            <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which SmartShield operates, without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold text-base mb-2">11. Contact</h3>
            <p>If you have questions about these Terms, please contact us at <span className="text-[#545BFF]">support@smartshield.app</span>.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10 bg-[#0a0a0f] shrink-0">
          {/* Checkbox */}
          <label className={`flex items-start gap-3 cursor-pointer mb-4 select-none group ${shake ? "animate-shake" : ""}`}>
            <div
              onClick={() => setChecked(!checked)}
              className={`mt-0.5 w-5 h-5 rounded shrink-0 border-2 flex items-center justify-center transition-all duration-200 ${
                checked
                  ? "bg-[#545BFF] border-[#545BFF]"
                  : "border-gray-500 group-hover:border-gray-300"
              }`}
            >
              {checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-gray-300 text-sm leading-snug">
              I have read and agree to the{" "}
              <span className="text-[#545BFF] font-medium">Terms and Conditions</span>.
              I understand that SmartShield provides security analysis for informational purposes only.
            </span>
          </label>

          {!checked && (
            <p className="text-amber-400 text-xs mb-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              You must agree to the terms before continuing.
            </p>
          )}

          <button
            onClick={handleAccept}
            className={`w-full h-11 rounded-full font-semibold text-sm transition-all duration-300 ${
              checked
                ? "bg-[#545BFF] hover:bg-[#4349dd] text-white shadow-[0_0_20px_rgba(84,91,255,0.4)] hover:-translate-y-0.5"
                : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
            }`}
          >
            {checked ? "I Agree — Continue to SmartShield" : "Please check the box above"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease; }
      `}</style>
    </div>
  );
}
