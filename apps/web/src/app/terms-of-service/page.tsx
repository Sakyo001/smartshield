"use client";

import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

export default function TermsOfService() {
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
              Terms of Service
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
              <h2 className="text-2xl font-bold text-heading">1. Agreement to Terms</h2>
              <p className="text-faded leading-relaxed">
                By accessing SmartShield, users agree to comply with these Terms of Service.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">2. System Description</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield is an AI-based cybersecurity tool designed to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Detect phishing websites</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Classify threats using ensemble machine learning</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Provide explainable outputs for user understanding</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                It is deployed as both a web platform and browser extension.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">3. Intended Use</h2>
              <p className="text-faded leading-relaxed mb-3">
                The system is intended for:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Cybersecurity awareness</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Safe browsing assistance</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Academic and research purposes</span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">4. System Capabilities and Limitations</h2>
              <p className="text-faded leading-relaxed mb-3">
                While SmartShield demonstrates high accuracy:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>It does not guarantee complete detection of all threats</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4 mb-3">
                It may not detect:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Visual phishing (e.g., logo spoofing)</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Non-web phishing (e.g., SMS, social engineering)</span>
                </li>
              </ul>
              <ul className="space-y-2 ml-6 mt-4">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Continuous updates are required for evolving threats</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Users must exercise independent judgment when browsing</span>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">5. User Responsibilities</h2>
              <p className="text-faded leading-relaxed mb-3">
                Users agree to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Use the system legally and ethically</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Not misuse the tool for malicious testing or attacks</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Avoid attempts to exploit or bypass the system</span>
                </li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">6. Prohibited Activities</h2>
              <p className="text-faded leading-relaxed mb-3">
                Users must NOT:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Use SmartShield to develop phishing attacks</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Reverse-engineer system components</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Interfere with system functionality</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Use the system for unauthorized cybersecurity testing</span>
                </li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">7. Intellectual Property</h2>
              <p className="text-faded leading-relaxed mb-3">
                All system components are owned by the SmartShield proponents, including:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>AI models and algorithms</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>System architecture</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Interface design and features</span>
                </li>
              </ul>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">8. Availability of Service</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield is provided on an as-available basis:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>No guarantee of uninterrupted service</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Maintenance and updates may occur</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Features may evolve over time</span>
                </li>
              </ul>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">9. Limitation of Liability</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield is a support tool, not a complete security solution:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>The developers are not liable for damages caused by undetected threats</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Users assume responsibility for their online activities</span>
                </li>
              </ul>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">10. Termination</h2>
              <p className="text-faded leading-relaxed">
                Access may be restricted if users violate these terms.
              </p>
            </div>

            {/* Section 11 */}
            <div className="space-y-4 pb-8">
              <h2 className="text-2xl font-bold text-heading">11. Governing Law</h2>
              <p className="text-faded leading-relaxed">
                These Terms are governed by the laws of the Republic of the Philippines.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
