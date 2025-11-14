import Navbar from "@components/layout/Navbar"
import Footer from "@components/layout/Footer"
import HeroSection from "@components/sections/HeroSection"
import FeatureGrid from "@components/sections/FeatureGrid"
import HowItWorks from "@components/sections/HowItWorks"
import AIBanner from "@components/sections/AIBanner"
import FAQSection from "@components/sections/FAQSection"
import CTASection from "@components/sections/CTASection"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <AIBanner />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
