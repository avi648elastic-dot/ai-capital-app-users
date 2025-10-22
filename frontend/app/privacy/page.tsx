'use client';

import Link from 'next/link';
import { Shield, Mail, Lock, Globe, Database, Users, FileText, CheckCircle, ExternalLink } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">AiCapital Privacy Policy</h1>
            </div>
            <Link 
              href="/"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2"
            >
              <span>Back to Home</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/50 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Your Privacy Matters</h2>
              <p className="text-blue-100 leading-relaxed mb-3">
                At AiCapital, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                mobile application and web platform.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center space-x-2 bg-green-900/30 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-200">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-900/30 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-200">CCPA Compliant</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-900/30 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-200">ISO 27001 Standards</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                <strong>Effective Date:</strong> January 1, 2025<br />
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Table of Contents</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              '1. Information We Collect',
              '2. How We Use Your Information',
              '3. Data Sharing and Third Parties',
              '4. Data Security',
              '5. Your Privacy Rights',
              '6. Data Retention',
              '7. International Data Transfers',
              '8. Cookies and Tracking',
              '9. Children\'s Privacy',
              '10. Third-Party Services',
              '11. Payment Processing',
              '12. Changes to This Policy',
              '13. Contact Us'
            ].map((item, index) => (
              <a 
                key={index}
                href={`#section-${index + 1}`}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section id="section-1" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Account Information:</strong> Name, email address, password (encrypted)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Profile Data:</strong> User preferences, settings, profile picture</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Authentication Data:</strong> Google OAuth tokens (if using Google Sign-In)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Financial and Investment Data</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Portfolio Information:</strong> Stock holdings, investment amounts, portfolio performance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Investment Preferences:</strong> Risk tolerance, investment goals, trading strategies</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Transaction History:</strong> Buy/sell decisions, portfolio adjustments</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Watchlists:</strong> Stocks you're monitoring and alert preferences</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Usage and Device Information</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Device Data:</strong> Device type, operating system, unique device identifiers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Usage Analytics:</strong> Features used, time spent, interaction patterns</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Technical Data:</strong> IP address, browser type, app version</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Location Data:</strong> Country/region for regulatory compliance (not precise location)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Communication Data</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Email Communications:</strong> Notification preferences, email history</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Push Notifications:</strong> Notification tokens, alert preferences</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>Customer Support:</strong> Support tickets, feedback, inquiries</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: How We Use Your Information */}
        <section id="section-2" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
            </div>
            
            <div className="space-y-3 text-slate-300">
              <p className="text-white font-medium mb-3">We use your information for the following purposes:</p>
              
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Service Provision</h4>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Create and manage your account</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Provide portfolio management and AI-powered investment recommendations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Process and display your investment data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Send important notifications about portfolio changes and alerts</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Service Improvement</h4>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Analyze usage patterns to improve our AI algorithms</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Develop new features based on user behavior</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Optimize app performance and user experience</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Conduct research and analytics</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Communication</h4>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Send welcome emails and onboarding information</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Deliver portfolio alerts and SELL/BUY recommendations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Provide customer support and respond to inquiries</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Send important updates about our services</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Security and Compliance</h4>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Prevent fraud and unauthorized access</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Comply with legal obligations and regulations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Enforce our Terms of Service</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Monitor for suspicious activities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Sharing */}
        <section id="section-3" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-white">3. Data Sharing and Third Parties</h2>
            </div>
            
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-100 font-semibold text-lg">
                ⚠️ We DO NOT sell your personal data to third parties
              </p>
            </div>

            <p className="text-slate-300 mb-4">
              We may share your information with trusted third parties only in the following circumstances:
            </p>

            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Service Providers</h4>
                <p className="text-slate-300 mb-2">We share data with vendors who help us operate our platform:</p>
                <ul className="space-y-2 text-slate-400 ml-4 text-sm">
                  <li>• Cloud hosting providers (MongoDB Atlas, Render, Vercel)</li>
                  <li>• Email service providers (for notifications)</li>
                  <li>• Payment processors (Stripe - see Section 11)</li>
                  <li>• Analytics services (for performance monitoring)</li>
                  <li>• Authentication providers (Google OAuth)</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Market Data Providers</h4>
                <p className="text-slate-300 text-sm">
                  We obtain real-time stock data from third-party financial data providers (Alpha Vantage, Finnhub, 
                  Financial Modeling Prep). We do not share your personal information with these providers.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Legal Requirements</h4>
                <p className="text-slate-300 text-sm">
                  We may disclose your information if required by law, court order, or government request, or to 
                  protect our rights, property, or safety.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Business Transfers</h4>
                <p className="text-slate-300 text-sm">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred. 
                  We will notify you before your information is transferred and becomes subject to a different privacy policy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Data Security */}
        <section id="section-4" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
            </div>
            
            <p className="text-slate-300 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🔐 Encryption</h4>
                <p className="text-slate-400 text-sm">
                  All data transmitted between your device and our servers is encrypted using TLS/SSL. 
                  Passwords are hashed using bcrypt.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🛡️ Access Controls</h4>
                <p className="text-slate-400 text-sm">
                  Strict access controls ensure only authorized personnel can access your data. 
                  We use role-based permissions.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">💾 Secure Storage</h4>
                <p className="text-slate-400 text-sm">
                  Data is stored in secure, encrypted databases with regular backups and disaster recovery plans.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🔍 Monitoring</h4>
                <p className="text-slate-400 text-sm">
                  Continuous security monitoring for suspicious activities, unauthorized access attempts, and potential breaches.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🔄 Regular Audits</h4>
                <p className="text-slate-400 text-sm">
                  Regular security audits, vulnerability assessments, and penetration testing.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">👨‍💻 Employee Training</h4>
                <p className="text-slate-400 text-sm">
                  All employees receive security training and sign confidentiality agreements.
                </p>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mt-4">
              <p className="text-yellow-100 text-sm">
                <strong>Note:</strong> While we implement strong security measures, no system is 100% secure. 
                We encourage you to use strong passwords and enable two-factor authentication.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Your Privacy Rights */}
        <section id="section-5" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">5. Your Privacy Rights</h2>
            </div>
            
            <p className="text-slate-300 mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">✅ Right to Access</h4>
                <p className="text-slate-400 text-sm">
                  Request copies of your personal data and information about how we process it.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">✏️ Right to Rectification</h4>
                <p className="text-slate-400 text-sm">
                  Correct inaccurate or incomplete personal data we hold about you.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🗑️ Right to Erasure</h4>
                <p className="text-slate-400 text-sm">
                  Request deletion of your personal data (subject to legal obligations).
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">⏸️ Right to Restriction</h4>
                <p className="text-slate-400 text-sm">
                  Limit how we process your personal data in certain circumstances.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📤 Right to Portability</h4>
                <p className="text-slate-400 text-sm">
                  Receive your data in a structured, machine-readable format.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🚫 Right to Object</h4>
                <p className="text-slate-400 text-sm">
                  Object to processing of your data for certain purposes.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🤖 Automated Decisions</h4>
                <p className="text-slate-400 text-sm">
                  Request human review of automated decisions (like AI recommendations).
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">❌ Right to Withdraw Consent</h4>
                <p className="text-slate-400 text-sm">
                  Withdraw consent for data processing at any time.
                </p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mt-4">
              <p className="text-blue-100 text-sm">
                <strong>How to Exercise Your Rights:</strong> Contact us at{' '}
                <a href="mailto:privacy@ai-capital.com" className="text-blue-300 hover:text-blue-200 underline">
                  privacy@ai-capital.com
                </a>
                {' '}or through your account settings. We will respond within 30 days.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Data Retention */}
        <section id="section-6" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-white">6. Data Retention</h2>
            </div>
            
            <p className="text-slate-300 mb-4">
              We retain your data for as long as necessary to provide our services and comply with legal obligations:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold">Account Data</h4>
                  <span className="text-blue-400 text-sm">Active + 7 years</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Retained while your account is active, plus 7 years after closure for regulatory compliance.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold">Portfolio Data</h4>
                  <span className="text-blue-400 text-sm">Active + 7 years</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Investment history retained for tax and regulatory purposes.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold">Usage Analytics</h4>
                  <span className="text-blue-400 text-sm">2 years</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Aggregated analytics data retained for service improvement.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold">Customer Support</h4>
                  <span className="text-blue-400 text-sm">5 years</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Support tickets and communications retained for reference.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold">Marketing Data</h4>
                  <span className="text-blue-400 text-sm">Until unsubscribe</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Deleted immediately upon unsubscribe or account closure.
                </p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mt-4">
              <p className="text-blue-100 text-sm">
                You can request earlier deletion of your data by contacting us, subject to our legal obligations.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: International Transfers */}
        <section id="section-7" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-white">7. International Data Transfers</h2>
            </div>
            
            <p className="text-slate-300 mb-4">
              Your data may be transferred to and processed in countries outside your residence, including the United States. 
              We ensure appropriate safeguards are in place:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🇪🇺 For EU/EEA Users</h4>
                <p className="text-slate-400 text-sm">
                  We use Standard Contractual Clauses (SCCs) approved by the European Commission to protect your data when 
                  transferred outside the EEA.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🇺🇸 For US Users</h4>
                <p className="text-slate-400 text-sm">
                  We comply with applicable US privacy laws including CCPA and state-specific regulations.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🌍 Global Standards</h4>
                <p className="text-slate-400 text-sm">
                  All our data processors are contractually bound to protect your data according to GDPR standards, 
                  regardless of their location.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Cookies */}
        <section id="section-8" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-white">8. Cookies and Tracking Technologies</h2>
            </div>
            
            <p className="text-slate-300 mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Essential Cookies (Required)</h4>
                <p className="text-slate-400 text-sm mb-2">
                  Necessary for platform functionality and security:
                </p>
                <ul className="text-slate-400 text-sm ml-4 space-y-1">
                  <li>• Authentication and session management</li>
                  <li>• Security and fraud prevention</li>
                  <li>• Load balancing and performance</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Analytics Cookies (Optional)</h4>
                <p className="text-slate-400 text-sm mb-2">
                  Help us understand how you use our platform:
                </p>
                <ul className="text-slate-400 text-sm ml-4 space-y-1">
                  <li>• Usage patterns and feature popularity</li>
                  <li>• Performance monitoring</li>
                  <li>• Error tracking and debugging</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Preference Cookies (Optional)</h4>
                <p className="text-slate-400 text-sm">
                  Remember your settings and preferences like theme, language, and dashboard layout.
                </p>
              </div>
            </div>

            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4 mt-4">
              <p className="text-orange-100 text-sm">
                <strong>Manage Cookies:</strong> You can control cookie preferences through your browser settings. 
                Note that disabling essential cookies may affect platform functionality.
              </p>
            </div>
          </div>
        </section>

        {/* Section 9: Children's Privacy */}
        <section id="section-9" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">9. Children's Privacy</h2>
            </div>
            
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-100 font-semibold">
                Our service is NOT intended for users under 18 years of age.
              </p>
            </div>

            <div className="text-slate-300 space-y-3">
              <p>
                AiCapital is a financial platform intended for adults (18+) only. We do not knowingly collect 
                personal information from children under 18.
              </p>
              <p>
                If we become aware that we have collected personal information from a child under 18, we will:
              </p>
              <ul className="ml-6 space-y-2">
                <li>• Delete the account immediately</li>
                <li>• Remove all associated data from our systems</li>
                <li>• Notify the parent or guardian if possible</li>
              </ul>
              <p>
                If you believe we have inadvertently collected information from a minor, please contact us immediately 
                at{' '}
                <a href="mailto:privacy@ai-capital.com" className="text-blue-400 hover:text-blue-300 underline">
                  privacy@ai-capital.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Section 10: Third-Party Services */}
        <section id="section-10" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-cyan-500" />
              <h2 className="text-2xl font-bold text-white">10. Third-Party Services</h2>
            </div>
            
            <p className="text-slate-300 mb-4">
              Our platform integrates with the following third-party services:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🔐 Google OAuth</h4>
                <p className="text-slate-400 text-sm">
                  For secure sign-in. See{' '}
                  <a href="https://policies.google.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                    Google's Privacy Policy
                  </a>
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">💳 Stripe</h4>
                <p className="text-slate-400 text-sm">
                  For payment processing. See{' '}
                  <a href="https://stripe.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                    Stripe's Privacy Policy
                  </a>
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📊 Financial Data Providers</h4>
                <p className="text-slate-400 text-sm">
                  Alpha Vantage, Finnhub, and Financial Modeling Prep for real-time market data. 
                  We do not share your personal information with these providers.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">☁️ Cloud Infrastructure</h4>
                <p className="text-slate-400 text-sm">
                  MongoDB Atlas, Render, and Vercel for hosting and data storage. All providers are GDPR-compliant.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📧 Email Service</h4>
                <p className="text-slate-400 text-sm">
                  Professional email service for notifications and alerts. All communications are encrypted.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 11: Payment Processing */}
        <section id="section-11" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-white">11. Payment Processing</h2>
            </div>
            
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-4">
              <p className="text-green-100 font-semibold">
                ✅ We do NOT store your credit card information on our servers.
              </p>
            </div>

            <div className="text-slate-300 space-y-4">
              <p>
                All payment processing is handled securely by Stripe, a PCI-DSS compliant payment processor:
              </p>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">What Stripe Collects:</h4>
                <ul className="ml-6 space-y-2 text-slate-400 text-sm">
                  <li>• Payment card information (encrypted)</li>
                  <li>• Billing address</li>
                  <li>• Transaction history</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">What We Store:</h4>
                <ul className="ml-6 space-y-2 text-slate-400 text-sm">
                  <li>• Subscription status (active/inactive)</li>
                  <li>• Subscription tier (Free/Premium/Premium Plus)</li>
                  <li>• Payment history (without card details)</li>
                  <li>• Stripe customer ID (encrypted)</li>
                </ul>
              </div>

              <p className="text-sm">
                For more information, see{' '}
                <a href="https://stripe.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                  Stripe's Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Section 12: Changes to Policy */}
        <section id="section-12" className="mb-8 scroll-mt-20">
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">12. Changes to This Privacy Policy</h2>
            </div>
            
            <div className="text-slate-300 space-y-3">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
                legal requirements, or other factors.
              </p>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">When We Update This Policy:</h4>
                <ul className="ml-6 space-y-2 text-slate-400 text-sm">
                  <li>• Update the "Last Updated" date at the top</li>
                  <li>• Notify you via email for material changes</li>
                  <li>• Display a prominent notice in the app</li>
                  <li>• Require acceptance for significant changes</li>
                </ul>
              </div>

              <p>
                Your continued use of our services after the effective date of changes constitutes acceptance of the 
                updated policy. If you do not agree with the changes, you should stop using our services and contact 
                us to delete your account.
              </p>

              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-100 text-sm">
                  <strong>Version History:</strong> Previous versions of this policy are available upon request at{' '}
                  <a href="mailto:privacy@ai-capital.com" className="text-blue-300 hover:text-blue-200 underline">
                    privacy@ai-capital.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 13: Contact Us */}
        <section id="section-13" className="mb-8 scroll-mt-20">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">13. Contact Us</h2>
            </div>
            
            <p className="text-slate-300 mb-6">
              For questions, concerns, or to exercise your privacy rights, please contact us:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">📧 Email</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Privacy Inquiries:</span><br />
                    <a href="mailto:privacy@ai-capital.com" className="text-blue-400 hover:text-blue-300">
                      privacy@ai-capital.com
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400">General Support:</span><br />
                    <a href="mailto:support@ai-capital.com" className="text-blue-400 hover:text-blue-300">
                      support@ai-capital.com
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400">Data Protection Officer:</span><br />
                    <a href="mailto:dpo@ai-capital.com" className="text-blue-400 hover:text-blue-300">
                      dpo@ai-capital.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">🌐 Online</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Website:</span><br />
                    <a href="https://ai-capital.info" className="text-blue-400 hover:text-blue-300">
                      https://ai-capital.info
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400">Support Portal:</span><br />
                    <a href="https://ai-capital.info/support" className="text-blue-400 hover:text-blue-300">
                      https://ai-capital.info/support
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400">Response Time:</span><br />
                    <span className="text-slate-300">Within 30 days (GDPR requirement)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mt-6">
              <p className="text-blue-100 text-sm">
                <strong>For EU/EEA Users:</strong> You also have the right to lodge a complaint with your local data 
                protection authority if you believe your rights have been violated.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 mt-12">
          <div className="text-center">
            <p className="text-slate-300 mb-4">
              This Privacy Policy is effective as of January 1, 2025 and was last updated on{' '}
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/legal/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>
              <span className="text-slate-600">•</span>
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Back to Home
              </Link>
              <span className="text-slate-600">•</span>
              <a href="mailto:privacy@ai-capital.com" className="text-blue-400 hover:text-blue-300">
                Contact Privacy Team
              </a>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              © {new Date().getFullYear()} AiCapital. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

