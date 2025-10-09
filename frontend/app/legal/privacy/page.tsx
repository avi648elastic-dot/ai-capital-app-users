'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function PrivacyPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-invert max-w-none">
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
              <h2 className="text-blue-300 text-lg font-semibold mb-2">🔒 GDPR Compliant</h2>
              <p className="text-blue-100">
                This Privacy Policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
                We are committed to protecting your personal data and respecting your privacy rights.
              </p>
            </div>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-white mb-2">Personal Information:</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                  <li>Name and email address (for account creation)</li>
                  <li>Portfolio data and investment preferences</li>
                  <li>Usage analytics and app interactions</li>
                  <li>Device information and IP address</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Financial Data:</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                  <li>Stock holdings and portfolio values</li>
                  <li>Investment decisions and preferences</li>
                  <li>Market data usage patterns</li>
                  <li>Risk tolerance assessments</li>
                </ul>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                We use your personal information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Provide and improve our portfolio management services</li>
                <li>Personalize your investment experience</li>
                <li>Send important service notifications</li>
                <li>Analyze usage patterns to enhance our platform</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing and Disclosure</h2>
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
                <p className="text-red-100 font-semibold">
                  We DO NOT sell your personal data to third parties.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                We may share your information only in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>With trusted service providers (under strict confidentiality agreements)</li>
                <li>To protect our rights and prevent fraud</li>
                <li>In case of business transfers (with notice to users)</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">4. Your Rights (GDPR)</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                Under GDPR, you have the following rights regarding your personal data:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Access & Portability</h3>
                  <p className="text-slate-300 text-sm">Request copies of your data and receive it in a portable format</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Rectification</h3>
                  <p className="text-slate-300 text-sm">Correct inaccurate or incomplete personal data</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Erasure</h3>
                  <p className="text-slate-300 text-sm">Request deletion of your personal data</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Restriction</h3>
                  <p className="text-slate-300 text-sm">Limit how we process your personal data</p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>End-to-end encryption for sensitive data transmission</li>
                <li>Secure data storage with regular backups</li>
                <li>Multi-factor authentication for account access</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and employee training</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We retain your personal data only as long as necessary to provide our services and comply with legal obligations. 
                Portfolio data is retained for the duration of your account plus 7 years for regulatory compliance. 
                You can request data deletion at any time through your account settings.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">7. Cookies and Tracking</h2>
              <p className="text-slate-300 leading-relaxed">
                We use essential cookies for platform functionality and analytics cookies to improve our services. 
                You can manage cookie preferences in your browser settings. We do not use tracking cookies for advertising purposes.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">8. International Transfers</h2>
              <p className="text-slate-300 leading-relaxed">
                Your data may be transferred to and processed in countries outside your residence. 
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) 
                and adequacy decisions from the European Commission.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
              <p className="text-slate-300 leading-relaxed">
                Our service is not intended for users under 18 years of age. We do not knowingly collect 
                personal information from children. If we become aware of such collection, we will delete the information immediately.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                via email or through our platform. Your continued use of the service constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">11. Contact Information</h2>
              <p className="text-slate-300 leading-relaxed">
                For privacy-related questions, data requests, or to exercise your rights, please contact us at:
                <br />
                <strong>Data Protection Officer:</strong> privacy@aicapital.com
                <br />
                <strong>General Privacy Inquiries:</strong> legal@aicapital.com
                <br />
                <strong>Last updated:</strong> January 2025
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={() => setIsModalOpen(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            I Understand and Accept
          </button>
        </div>
      </div>
    </div>
  );
}
