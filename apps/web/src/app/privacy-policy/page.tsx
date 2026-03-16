import React from 'react';

export const metadata = {
  title: 'Privacy Policy - SmartShield',
  description: 'SmartShield Privacy Policy - Learn how we protect your data',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2 text-white">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: February 23, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              SmartShield (&quot;we,&quot; &quot;our,&quot; &quot;us,&quot; or &quot;Company&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our browser extension and related services.
            </p>
            <p className="text-gray-300">
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, 
              please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Domain Information</h3>
            <p className="text-gray-300 mb-4">
              When you visit a website, SmartShield collects the domain name (e.g., example.com) to perform 
              security analysis. We do NOT collect:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>URLs with query parameters or personal data in the path</li>
              <li>Page content or form data</li>
              <li>Cookies or session tokens</li>
              <li>Login credentials or sensitive personal information</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 WHOIS & DNS Data</h3>
            <p className="text-gray-300 mb-4">
              To assess domain security, we retrieve publicly available WHOIS and DNS records through 
              third-party APIs. This data includes:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Domain registrant information (publicly available)</li>
              <li>DNS records (MX, A, NS, TXT records)</li>
              <li>SSL/TLS certificate details</li>
              <li>Domain registration and expiration dates</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Threat Analysis & Cache</h3>
            <p className="text-gray-300 mb-4">
              SmartShield stores threat assessment results locally on your device for 24 hours to improve performance 
              and reduce API calls. This data is:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Stored exclusively on your local machine</li>
              <li>Never transmitted to our servers</li>
              <li>Automatically deleted after 24 hours</li>
              <li>Not used for profiling or tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use collected information solely for:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Detecting phishing attempts and malicious domains</li>
              <li>Providing real-time security threat alerts</li>
              <li>Displaying threat analysis and remediation recommendations</li>
              <li>Improving detection algorithms (anonymized data only)</li>
              <li>Preventing fraud and malicious activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing & Third Parties</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Third-Party APIs</h3>
            <p className="text-gray-300 mb-4">
              SmartShield uses the following third-party services to perform security analysis:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>WHOIS Lookup Services:</strong> To retrieve domain registration information</li>
              <li><strong>DNS Query Services:</strong> To analyze domain DNS records</li>
              <li><strong>SSL Certificate Checkers:</strong> To verify SSL/TLS configuration</li>
              <li><strong>Threat Databases:</strong> To cross-reference known malicious domains</li>
            </ul>
            <p className="text-gray-300 mb-4">
              These services receive only the domain name for analysis. Please review their privacy policies 
              for their data handling practices.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 We Do NOT Share Data With</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Marketing or advertising partners</li>
              <li>Data brokers or analytics companies</li>
              <li>Social media platforms</li>
              <li>Any third party for commercial purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Privacy Rights</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Data Control</h3>
            <p className="text-gray-300 mb-4">
              Since SmartShield stores all threat data locally on your device:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>You have complete control over your data</li>
              <li>You can clear cache anytime through extension settings</li>
              <li>Uninstalling the extension deletes all stored data</li>
              <li>No central server stores your browsing history</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Opt-Out</h3>
            <p className="text-gray-300 mb-4">
              You can disable SmartShield at any time by:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Toggling &quot;Safe Mode&quot; off in the extension popup</li>
              <li>Removing the extension from Chrome</li>
              <li>Using the Chrome settings to disable the extension</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
            <p className="text-gray-300 mb-4">
              SmartShield implements industry-standard security practices:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>All API communications use HTTPS encryption</li>
              <li>Local data is encrypted in Chrome storage</li>
              <li>We do not log or store domain lists on central servers</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Children&apos;s Privacy</h2>
            <p className="text-gray-300">
              SmartShield is not intended for children under 13. We do not knowingly collect personal 
              information from children. If we learn that we have collected personal information from a 
              child under 13, we will delete such information promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Policy Updates</h2>
            <p className="text-gray-300 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or other factors. We will notify you of any material changes 
              by updating the &quot;Last Updated&quot; date at the top of this page.
            </p>
            <p className="text-gray-300">
              Continued use of SmartShield after changes are posted means you accept the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about this Privacy Policy or SmartShield&apos;s privacy practices, please contact us at:
            </p>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300">
                <strong>Email:</strong> privacy@smartshield.example.com
              </p>
              <p className="text-gray-300 mt-2">
                <strong>Website:</strong> smartshield.example.com
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-300 mb-4">
              Under California law, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Know what personal data is collected</li>
              <li>Delete your personal data</li>
              <li>Opt-out of data sales (we don&apos;t sell data)</li>
              <li>Non-discrimination for exercising your rights</li>
            </ul>
            <p className="text-gray-300 mt-4">
              Since SmartShield collects data locally and does not maintain a centralized user database, 
              these rights are automatically enforced through local storage control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. GDPR Compliance (EU Users)</h2>
            <p className="text-gray-300 mb-4">
              SmartShield complies with the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Data is processed with legitimate security interests</li>
              <li>No personal data is stored long-term</li>
              <li>You can withdraw consent anytime by disabling the extension</li>
              <li>Data retention is minimal (24-hour cache only)</li>
            </ul>
          </section>

          <p className="text-gray-400 text-sm mt-12">
            © 2026 SmartShield. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
