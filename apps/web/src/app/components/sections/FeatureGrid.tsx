import Image from "next/image"

export default function FeatureGrid() {
  const features = [
    {
      icon: "/images/Artificial Intelligence.png",
      title: "AI Threat Detection",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
      color: "text-[#6B73FF]"
    },
    {
      icon: "/images/freepik--Icons--inject-1--inject-9.png",
      title: "Real-Time Defense",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
      color: "text-[#4ADE80]"
    },
    {
      icon: "/images/Layers.png",
      title: "Multi-Layer Security",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
      color: "text-[#FFA500]"
    },
    {
      icon: "/images/Search More.png",
      title: "Deep Link Analysis",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
      color: "text-[#8B5CF6]"
    },
    {
      icon: "/images/Security Lock.png",
      title: "SSL & Domain Verification",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
      color: "text-[#3B82F6]"
    },
    {
      icon: "/images/Protect.png",
      title: "Zero-Day Protection",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
      color: "text-[#EF4444]"
    }
  ]

  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-white transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-black mb-4 transition-colors">
            Six Ways <span className="text-[#6B73FF]">SmartShield</span> Keeps You Safe
          </h2>
          <p className="text-gray-600 dark:text-gray-600 text-base max-w-2xl mx-auto transition-colors">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 md:p-10  border-2 border-[#7B83FF]/40  hover:border-[#7B83FF]  transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"

            >
              <div className="mb-5">
                <div className={`${feature.color}`}>
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={48}
                    height={48}
                    className="group-hover:scale-110 transition"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-black mb-3 transition-colors">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-600 text-sm leading-relaxed transition-colors">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}