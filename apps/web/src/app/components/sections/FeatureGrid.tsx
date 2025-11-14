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
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Six Ways <span className="text-[#6B73FF]">SmartShield</span> Keeps You Safe
          </h2>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition group"
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
              <h3 className="text-xl font-bold text-black mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}