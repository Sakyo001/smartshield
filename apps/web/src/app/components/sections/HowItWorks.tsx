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
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            How <span className="text-[#6B73FF]">SmartShield</span> Protects You
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center bg-gray-50 rounded-2xl p-8 relative">
              <div className="absolute top-6 left-6 w-10 h-10 bg-[#E5E7FF] rounded-full flex items-center justify-center text-[#6B73FF] font-bold text-lg">
                {step.number}
              </div>
              <div className="mb-6 mt-8">
                <Image
                  src={images[index].src}
                  alt={step.title}
                  width={120}
                  height={120}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}