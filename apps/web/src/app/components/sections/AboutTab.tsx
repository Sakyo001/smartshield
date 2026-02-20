"use client";

import Image from "next/image";

export default function AboutTab() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B73FF]/10 border border-[#6B73FF]/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
          <span className="text-[#6B73FF] font-semibold text-sm">About Us</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Protecting You from <span className="text-[#6B73FF]">Phishing Threats</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          SmartShield is your intelligent guardian against online phishing attacks, 
          using advanced AI technology to keep you safe while browsing the web.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-gradient-to-br from-[#6B73FF]/5 to-purple-500/5 rounded-3xl p-8 md:p-12 mb-12 border border-[#6B73FF]/10">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#6B73FF] flex items-center justify-center flex-shrink-0">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Our Mission
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              We believe everyone deserves to browse the internet safely without fear of falling 
              victim to phishing scams. Our mission is to provide cutting-edge, AI-powered protection 
              that's accessible to everyone, making the web a safer place one URL at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B73FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            AI-Powered Detection
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Our advanced machine learning algorithms analyze URLs in real-time, 
            detecting even the most sophisticated phishing attempts.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
          <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Real-Time Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Get instant security assessments with detailed risk scores and 
            comprehensive threat intelligence reports.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Community Driven
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Join a community of security-conscious users sharing insights and 
            feedback to make the internet safer for everyone.
          </p>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Powered by Advanced Technology
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#6B73FF]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B73FF" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Machine Learning Models
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Trained on millions of URLs to identify patterns and threats
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#6B73FF]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B73FF" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    WHOIS & DNS Analysis
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Deep domain investigation and SSL certificate verification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#6B73FF]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B73FF" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Real-Time Threat Intelligence
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Connected to global security databases and blacklists
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6B73FF]/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-[#6B73FF] to-[#8a9dff] rounded-3xl p-12 text-white text-center">
              <div className="text-6xl font-bold mb-4">99.9%</div>
              <div className="text-xl font-semibold mb-2">Accuracy Rate</div>
              <p className="text-white/80">
                In detecting phishing attempts and protecting our users
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
