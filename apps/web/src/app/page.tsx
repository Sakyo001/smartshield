'use client';
import React from 'react';
import Navbar from "@components/layout/Navbar"
import Footer from "@components/layout/Footer"
import HeroSection from "@components/sections/HeroSection"
import FeatureGrid from "@components/sections/FeatureGrid"
import HowItWorks from "@components/sections/HowItWorks"
import AIBanner from "@components/sections/AIBanner"
import CTASection from "@components/sections/CTASection"
import ScanTab from "@components/sections/ScanTab"
import AboutTab from "@components/sections/AboutTab"
import FAQTab from "@components/sections/FAQTab"
import ScrollToTopButton from "@components/ui/ScrollToTopButton"
import ChatbotWidget from "@components/ui/ChatbotWidget"

export default function Home() {
  return (
    <div className="min-h-screen">
      <ScrollToTopButton />
      <ChatbotWidget />
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>

      <FeatureGrid />

      <HowItWorks />

      <ScanTab />
      <AIBanner />

      <AboutTab />
      <FAQTab />

      <CTASection />
      <Footer />
    </div>
  );
}
