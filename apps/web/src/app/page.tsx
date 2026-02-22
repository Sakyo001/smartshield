'use client';
import React, { useEffect, useRef, useState } from 'react';
import Navbar from "@components/layout/Navbar"
import Footer from "@components/layout/Footer"
import HeroSection from "@components/sections/HeroSection"
import FeatureGrid from "@components/sections/FeatureGrid"
import HowItWorks from "@components/sections/HowItWorks"
import AIBanner from "@components/sections/AIBanner"
import FAQSection from "@components/sections/FAQSection"
import CTASection from "@components/sections/CTASection"
import { Tabs } from "@components/ui/Tabs"
import ScanTab from "@components/sections/ScanTab"
import AboutTab from "@components/sections/AboutTab"
import FAQTab from "@components/sections/FAQTab"

export default function Home() {
  const [activeTab, setActiveTab] = useState('scan');

  // Handle hash changes to switch tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'about' || hash === 'faq') {
        setActiveTab(hash);
        // Scroll to the scan section which contains the tabs
        const scanSection = document.getElementById('scan');
        if (scanSection) {
          scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (hash === 'scan') {
        setActiveTab('scan');
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  return (
   
    <div className="min-h-screen">
      
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>
      <FeatureGrid />
      <HowItWorks />
      <AIBanner />
      
      {/* Tabbed Section */}
      <section id="scan" className="py-16 md:py-24 px-4 md:px-6 bg-[#0a0a0f] relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6B73FF]/5 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B73FF]/10 border border-[#6B73FF]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
              <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
                Explore SmartShield
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-gray-400 text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
              View your recent scans, learn about our mission, and find answers to your questions
            </p>
          </div>

          <Tabs
            defaultValue={activeTab}
            tabs={[
              {
                label: "Recent Scans",
                value: "scan",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                )
              },
              {
                label: "About",
                value: "about",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )
              },
              {
                label: "FAQ",
                value: "faq",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                )
              }
            ]}
            onTabChange={(tab) => setActiveTab(tab)}
          >
            {(activeTab) => (
              <>
                {activeTab === "scan" && <ScanTab />}
                {activeTab === "about" && <AboutTab />}
                {activeTab === "faq" && <FAQTab />}
              </>
            )}
          </Tabs>
        </div>
      </section>

      <CTASection />
      <Footer /> 
    </div>
    

  )
}
