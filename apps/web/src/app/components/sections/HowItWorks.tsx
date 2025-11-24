import Image from "next/image"

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: "/images/Group 55.png",
      title: "Scan for threats",
      description: "Our AI-powered engine analyzes the URL for suspicious patterns and hidden traps."
    },
    {
      number: "2",
      icon: "/images/Group 55 (1).png",
      title: "Cross-check databases",
      description: "We verify each site against trusted threat intelligence sources."
    },
    {
      number: "3",
      icon: "/images/Group 55 (2).png",
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
    <section className="py-12 md:py-20 px-4 md:px-6 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            How <span className="text-[#6B73FF]">SmartShield</span> Protects You
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 relative transition-colors hover:shadow-lg">
              <div className="absolute top-4 md:top-6 left-4 md:left-6 w-10 h-10 bg-[#E5E7FF] dark:bg-[#6B73FF]/20 rounded-full flex items-center justify-center text-[#6B73FF] dark:text-[#8B93FF] font-bold text-lg">
                {step.number}
              </div>
              <div className="mb-6 mt-8">
                <Image
                  src={step.icon}
                  alt={step.title}
                  width={120}
                  height={120}
                  className="mx-auto w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}