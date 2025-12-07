import Image from "next/image"
import Link from "next/link"

export default function AIBanner() {
  const features = [
    "Machine Learning Detection",
    "Real-Time Monitoring",
    "Browser Integration",
    "Lightweight & Fast",
    "Privacy-First Design"
  ]

  return (
    <section className="py-20 px-6 bg-white transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1a1a2e] dark:bg-[#141414] rounded-3xl overflow-hidden transition-colors">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="p-12 lg:p-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-white mb-6 leading-tight transition-colors">
                <span className="text-[#6B7FFF]">Smarter</span> Protection<br />
                Powered by <span className="text-[#6B7FFF]">AI</span>
              </h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-white dark:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="bg-[#6B7FFF] text-white px-7 py-3 rounded-lg hover:bg-[#5A6BE8] transition font-medium shadow-lg shadow-[#6B7FFF]/30"
                >
                  Get the Extension
                </Link>
                <button className="text-white border border-gray-500 dark:border-gray-600 px-7 py-3 rounded-lg hover:border-white hover:bg-white/10 transition font-medium">
                  Scan Website
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative p-12">
              <Image
                src="/images/Typing-bro 1.png"
                alt="AI Protection"
                width={500}
                height={500}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}