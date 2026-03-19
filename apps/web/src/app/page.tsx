import dynamic from "next/dynamic";
import Navbar from "@components/layout/Navbar"
import Footer from "@components/layout/Footer"
import HeroSection from "@components/sections/HeroSection"
import DeferredScanTab from "@components/sections/DeferredScanTab"
import ScrollToTopButton from "@components/ui/ScrollToTopButton"
import DeferredChatbot from "@components/ui/DeferredChatbot"
import ResetScrollOnReload from "@components/ui/ResetScrollOnReload"

const FeatureGrid = dynamic(() => import("@components/sections/FeatureGrid"), {
  loading: () => <section className="min-h-[60vh]" aria-hidden />,
});

const HowItWorks = dynamic(() => import("@components/sections/HowItWorks"), {
  loading: () => <section className="min-h-[60vh]" aria-hidden />,
});

const AIBanner = dynamic(() => import("@components/sections/AIBanner"), {
  loading: () => <section className="min-h-[40vh]" aria-hidden />,
});

const AboutTab = dynamic(() => import("@components/sections/AboutTab"), {
  loading: () => <section className="min-h-[40vh]" aria-hidden />,
});

const FAQTab = dynamic(() => import("@components/sections/FAQTab"), {
  loading: () => <section className="min-h-[40vh]" aria-hidden />,
});

const CTASection = dynamic(() => import("@components/sections/CTASection"), {
  loading: () => <section className="min-h-[55vh]" aria-hidden />,
});

export default function Home() {
  return (
    <div className="min-h-screen">
      <ResetScrollOnReload />
      <ScrollToTopButton />
      <DeferredChatbot />
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>

      <FeatureGrid />

      <HowItWorks />

      <div id="scan">
        <DeferredScanTab />
      </div>
      <AIBanner />

      <div id="about">
        <AboutTab />
      </div>
      <div id="faq">
        <FAQTab />
      </div>

      <CTASection />
      <Footer />
    </div>
  );
}
