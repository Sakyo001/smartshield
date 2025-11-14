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
    <section className="py-20 px-6 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="p-12 lg:p-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                <span className="text-[#7B83FF]">Smarter</span> Protection<br />
                Powered by <span className="text-[#7B83FF]">AI</span>
              </h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
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
                  className="bg-[#6B73FF] text-white px-7 py-3 rounded-lg hover:bg-[#5A62E8] transition font-medium shadow-lg shadow-[#6B73FF]/30"
                >
                  Get the Extension
                </Link>
                <button className="text-white border border-gray-600 px-7 py-3 rounded-lg hover:border-gray-400 hover:bg-white/5 transition font-medium">
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