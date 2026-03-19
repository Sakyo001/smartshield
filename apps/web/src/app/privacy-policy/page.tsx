"use client";

import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative pt-20 pb-12 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(84,91,255,0.1) 0%, transparent 50%)",
          }} />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-heading mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-faded">
              SmartShield: AI-Powered Phishing Website Detector
            </p>
            <p className="text-sm text-faded/70 mt-2">
              Effective Date: March 2026
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">1. Introduction</h2>
              <p className="text-faded leading-relaxed">
                SmartShield is an AI-powered phishing website detection system that utilizes ensemble machine learning and Explainable Artificial Intelligence (XAI) to classify websites as phishing or legitimate. This Privacy Policy outlines how data is processed, protected, and handled in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).
              </p>
              <p className="text-faded leading-relaxed">
                The system is designed with a privacy-first approach, ensuring transparency, accountability, and minimal data handling.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">2. Scope of This Policy</h2>
              <p className="text-faded leading-relaxed mb-4">
                This policy applies to all users interacting with SmartShield through:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Web Application Interface</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Browser Extension Deployment</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                These platforms provide real-time phishing detection and analysis.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">3. Nature of Data Processed</h2>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-heading">3.1 Input Data</h3>
                <p className="text-faded leading-relaxed mb-3">
                  SmartShield processes only technical and non-personal data, including:
                </p>
                <ul className="space-y-2 ml-6">
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>Website URLs submitted or visited</span>
                  </li>
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>Domain-based features (e.g., domain age, reputation)</span>
                  </li>
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>Web-based features (e.g., HTML structure, URL patterns)</span>
                  </li>
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>Third-party reputation indicators</span>
                  </li>
                </ul>
                <p className="text-faded leading-relaxed mt-3">
                  These inputs are required for machine learning classification.
                </p>
              </div>

              <div className="space-y-3 pt-6">
                <h3 className="text-lg font-semibold text-heading">3.2 No Personal Data Collection</h3>
                <p className="text-faded leading-relaxed mb-3">
                  SmartShield strictly adheres to the following principles:
                </p>
                <ul className="space-y-2 ml-6">
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>No collection of personally identifiable information (PII)</span>
                  </li>
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>No storage of browsing history</span>
                  </li>
                  <li className="text-faded flex items-start gap-3">
                    <span className="text-[#545BFF] font-bold mt-1">•</span>
                    <span>No tracking of user identity or behavior</span>
                  </li>
                </ul>
                <p className="text-faded leading-relaxed mt-3">
                  The system operates independently of user identity.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">4. Purpose of Data Processing</h2>
              <p className="text-faded leading-relaxed mb-3">
                All processed data is used exclusively for:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Real-time phishing detection</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Classification of websites (phishing vs legitimate)</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Generation of explainable outputs using XAI (LIME, SHAP)</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Improving system accuracy and reliability</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                No data is used for marketing, profiling, or surveillance.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">5. Data Processing Mechanism</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield follows a local and secure processing model:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Data is analyzed through a stacking ensemble model (CNN, SVM, XGBoost + Logistic Regression meta-learner)</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Feature extraction and classification occur in real-time</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>XAI techniques provide transparent explanations</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4 mb-3">
                All processing is aligned with ethical AI principles such as:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Transparency</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Fairness</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Accountability</span>
                </li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">6. Data Storage and Retention</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield enforces a zero-retention policy:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>No persistent storage of user-submitted data</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>All inputs are processed temporarily</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Data is discarded immediately after classification</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                This ensures compliance with data minimization and proportionality principles.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">7. Data Security Measures</h2>
              <p className="text-faded leading-relaxed mb-3">
                To protect system integrity and user privacy:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Processing is performed locally whenever possible</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>No centralized database of user data is maintained</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Secure handling of input URLs</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Protection against unauthorized access</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                These safeguards align with national cybersecurity and privacy standards.
              </p>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">8. Third-Party Integration</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield may utilize:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Public datasets</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Threat intelligence sources</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Domain reputation services</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4 mb-3">
                However:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>No personal user data is transmitted</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Only technical website-related data may be processed</span>
                </li>
              </ul>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">9. User Rights</h2>
              <p className="text-faded leading-relaxed mb-3">
                Users are entitled to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Use the system anonymously</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Be informed about how their data is processed</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Discontinue use at any time</span>
                </li>
              </ul>
              <p className="text-faded leading-relaxed mt-4">
                Since no personal data is stored, rights such as data access or deletion are inherently preserved.
              </p>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">10. Compliance with Law</h2>
              <p className="text-faded leading-relaxed mb-3">
                SmartShield complies with:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Data Privacy Act of 2012 (RA 10173)</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Principles of lawful, fair, and transparent processing</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Philippine National Cybersecurity Plan alignment</span>
                </li>
              </ul>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-heading">11. Policy Updates</h2>
              <p className="text-faded leading-relaxed mb-3">
                This Privacy Policy may be updated to reflect:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>System improvements</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>Legal or regulatory changes</span>
                </li>
                <li className="text-faded flex items-start gap-3">
                  <span className="text-[#545BFF] font-bold mt-1">•</span>
                  <span>New features or integrations</span>
                </li>
              </ul>
            </div>

            {/* Section 12 */}
            <div className="space-y-4 pb-8">
              <h2 className="text-2xl font-bold text-heading">12. Contact Information</h2>
              <p className="text-faded leading-relaxed">
                For inquiries regarding privacy and data protection:
              </p>
              <p className="text-lg">
                📧 <a href="mailto:smartshield.project@gmail.com" className="text-[#545BFF] hover:text-[#545BFF]/80 transition-colors font-medium">
                  smartshield.project@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
