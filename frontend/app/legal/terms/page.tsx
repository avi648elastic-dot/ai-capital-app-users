'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function TermsPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-4xl w-full h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Terms of Service</h1>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="prose prose-invert max-w-none">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <h2 className="text-red-300 text-lg font-semibold mb-2">⚠️ IMPORTANT LEGAL DISCLAIMER</h2>
              <p className="text-red-100">
                <strong>AiCapital does NOT provide financial advice.</strong> All information, analysis, and recommendations 
                are for educational and informational purposes only. You are solely responsible for your investment decisions.
              </p>
            </div>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                By accessing and using AiCapital ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">2. Services Provided</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                AiCapital provides portfolio management tools, market data analysis, and educational resources. Our services include:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Portfolio tracking and analysis</li>
                <li>Market data and stock information</li>
                <li>Educational content about investing</li>
                <li>Portfolio optimization suggestions</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">3. Investment Disclaimers</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                <p className="text-yellow-100 font-semibold">
                  NOT FINANCIAL ADVICE: Nothing on this platform constitutes financial, investment, or trading advice.
                </p>
              </div>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Past performance does not guarantee future results</li>
                <li>All investments carry risk of loss</li>
                <li>You should consult with qualified financial advisors before making investment decisions</li>
                <li>We are not registered investment advisors</li>
                <li>Market data may be delayed or inaccurate</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                As a user, you agree to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Use the service only for lawful purposes</li>
                <li>Provide accurate and current information</li>
                <li>Not attempt to gain unauthorized access to the system</li>
                <li>Not use the service for any fraudulent or illegal activities</li>
                <li>Be responsible for all investment decisions made using our tools</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">5. Limitation of Liability</h2>
              <p className="text-slate-300 leading-relaxed">
                To the fullest extent permitted by law, AiCapital shall not be liable for any direct, indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to, loss of profits, data, use, 
                goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">6. Data and Privacy</h2>
              <p className="text-slate-300 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, 
                and protect your information. By using our service, you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">7. Termination</h2>
              <p className="text-slate-300 leading-relaxed">
                We may terminate or suspend your account and access to the service immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">8. Governing Law</h2>
              <p className="text-slate-300 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the jurisdiction in which AiCapital operates, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">9. Contact Information</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
                <br />
                Email: legal@aicapital.com
                <br />
                Last updated: January 2025
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
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
