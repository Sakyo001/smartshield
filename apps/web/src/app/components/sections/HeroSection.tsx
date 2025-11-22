import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0a0f] dark:via-[#1a1a2e] dark:to-[#16213e] overflow-hidden transition-colors">
      {/* Background gradient effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#545BFF]/10 dark:bg-[#545BFF]/20 rounded-full blur-[120px]"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors">
              Your <span className="text-[#7B83FF]">AI Shield</span><br />
              Against <span className="text-[#7B83FF]">Suspicious</span><br />
              Websites
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-base mb-8 leading-relaxed max-w-lg transition-colors">
              Our intelligent machine learning engine works around the clock to scan every link you visit, detecting suspicious behavior, fake pages, and phishing attempts before they can cause harm.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="bg-[#6B73FF] text-white px-7 py-3 rounded-lg hover:bg-[#5A62E8] transition font-medium shadow-lg shadow-[#6B73FF]/30"
              >
                Get the Extension
              </Link>
              <Link href="/dashboard" className="text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 px-7 py-3 rounded-lg hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition font-medium">
                Scan Website
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <Image
              src="/images/laptop.png"
              alt="SmartShield Protection"
              width={600}
              height={400}
              priority
              className="w-full h-auto relative z-10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}