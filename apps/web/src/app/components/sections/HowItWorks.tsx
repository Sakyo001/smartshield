import Image from "next/image"

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: "/images/freepik--Shield--inject-3.png",
      title: "Scan for threats",
      description: "Our AI-powered engine analyzes the URL for suspicious patterns and hidden traps."
    },
    {
      number: "2",
      icon: "/images/freepik--World--inject-1--inject-9.png",
      title: "Cross-check databases",
      description: "We verify each site against trusted threat intelligence sources."
    },
    {
      number: "3",
      icon: "/images/Group 36.png",
      title: "Deliver instant verdict",
      description: "In seconds, you'll know whether the site is safe, warning, or dangerous."
    }
  ]

  const images = [
    {
        src: "/images/freepik--Shield--inject-3.png",
    }, 
    {
        src: "/images/freepik--Icons--inject-1--inject-9.png",
    }, 
    {
        src: "/images/Group 36.png",
    }
  ]

  return (
    <section className="py-10 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-20">
            How <span className="text-[#6B73FF]">SmartShield</span> Protects You
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="group relative bg-white rounded-3xl p-8 md:p-10 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-gray-100 hover:border-blue-200"
            >
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50 group-hover:to-purple-50 rounded-3xl transition-all duration-500"></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon container */}
                <div className="relative mb-10">
                  <div className="bg-gradient-to-br from-[#F3F4FF] to-[#E8ECFF] rounded-3xl p-12 min-h-[240px] flex items-center justify-center relative transition-all duration-500 group-hover:from-[#E8ECFF] group-hover:to-[#DDE3FF]">
                    {/* Number badge */}
                    <div className="absolute top-5 left-5 w-10 h-10 bg-gradient-to-br from-[#6B73FF] to-[#5A62E8] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <Image
                      src={step.icon}
                      alt={step.title}
                      width={120}
                      height={120}
                      className="w-28 h-28 object-contain transition-all duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
                
                {/* Text content */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 transition-colors duration-300 group-hover:text-[#6B73FF]">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed transition-colors duration-300 group-hover:text-gray-700">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}