"use client";

import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative pt-20 pb-12 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(84,91,255,0.1) 0%, transparent 50%)",
          }} />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-heading mb-4">
              Cookie Policy
            </h1>
            <p className="text-sm text-faded/70">
              Effective Date: March 2026
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">1. Overview</h2>
              <p className="text-faded leading-relaxed">
                This Cookie Policy explains how SmartShield uses cookies to support system functionality.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">2. Purpose of Cookies</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield uses cookies strictly for:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Session management</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Maintaining system functionality</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Enhancing user experience</span>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">3. Minimal Data Usage</h2>
              <p className="text-faded leading-relaxed mb-3">
                In line with its privacy-first design:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Cookies do NOT store personal data</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Cookies do NOT track user behavior across websites</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Cookies are NOT used for advertising</span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">4. Types of Cookies Used</h2>
              <p className="text-faded leading-relaxed mb-4">
                SmartShield uses the following types of cookies:
              </p>
              <div className="space-y-4">
                <div className="pl-6 border-l-2 border-[#545BFF]/30">
                  <h3 className="font-semibold text-heading mb-2">Essential Cookies</h3>
                  <p className="text-faded text-sm">
                    Required for system operation and core functionality. These cookies are necessary for the platform to function properly.
                  </p>
                </div>
                <div className="pl-6 border-l-2 border-[#545BFF]/30">
                  <h3 className="font-semibold text-heading mb-2">Session Cookies</h3>
                  <p className="text-faded text-sm">
                    Temporary and deleted after use. These cookies maintain your session state while using SmartShield.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">5. Third-Party Cookies</h2>
              <p className="text-faded leading-relaxed mb-3">
                If integrated (optional), third-party services may use cookies for:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Analytics</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Security monitoring</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                These operate under their own policies.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">6. User Control</h2>
              <p className="text-faded leading-relaxed mb-3">
                Users may:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Disable cookies via browser settings</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Clear cookies at any time</span>
                </li>
              </ul>
              <div className="mt-6 p-4 rounded-lg bg-[#545BFF]/10 border border-[#545BFF]/20">
                <p className="text-sm text-faded font-medium">
                  ⚠️ <span className="font-semibold">Note:</span> Disabling cookies may affect system performance.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="space-y-4 pb-8">
              <h2 className="text-2xl font-bold text-heading">7. Updates</h2>
              <p className="text-faded leading-relaxed">
                This policy may be updated based on system enhancements.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
