import Image from "next/image"
import Link from "next/link"

export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-[#0a0a0f] relative overflow-hidden transition-colors">
      {/* Background glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-[#545BFF]/10 dark:bg-[#545BFF]/20 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 transition-colors">
          Browse Safe.<br />
          Stay Smart.
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="bg-[#6B73FF] text-white px-7 py-3 rounded-lg hover:bg-[#5A62E8] transition font-medium shadow-lg shadow-[#6B73FF]/30"
          >
            Get the Extension
          </Link>
          <button className="text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 px-7 py-3 rounded-lg hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition font-medium">
            Scan Website
          </button>
        </div>

        {/* Shield illustration */}
        <div className="relative inline-block">
          <Image
            src="/images/Group52.png"
            alt="Protected"
            width={550}
            height={550}
          />
        </div>
      </div>
    </section>
  )
}