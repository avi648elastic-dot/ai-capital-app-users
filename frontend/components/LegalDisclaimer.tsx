'use client';

import { AlertTriangle, Shield, Info } from 'lucide-react';
import { useState } from 'react';

export default function LegalDisclaimer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/95 to-orange-900/95 backdrop-blur-md border-t-2 border-red-500/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-red-300 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-bold text-white">⚠️ IMPORTANT LEGAL DISCLAIMER</h3>
                <Shield className="w-4 h-4 text-red-300" />
              </div>
              <div className={`text-xs text-red-100 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                <p className="font-semibold mb-1">
                  NOT FINANCIAL ADVICE. FOR EDUCATIONAL PURPOSES ONLY.
                </p>
                {isExpanded && (
                  <>
                    <p className="mb-2">
                      <strong>AiCapital</strong> is an AI-powered portfolio tracking and analysis tool. 
                      We DO NOT provide financial advice, investment recommendations, or trading signals.
                    </p>
                    <ul className="list-disc list-inside space-y-1 mb-2">
                      <li><strong>No Licensed Advisors:</strong> We are not registered investment advisors, broker-dealers, or financial planners.</li>
                      <li><strong>No Liability:</strong> All AI-generated insights are for informational purposes only. We assume NO responsibility for your investment decisions.</li>
                      <li><strong>High Risk:</strong> Investing in stocks involves substantial risk of loss. You may lose your entire investment.</li>
                      <li><strong>Do Your Research:</strong> Always consult with licensed financial professionals before making investment decisions.</li>
                      <li><strong>Past Performance:</strong> Historical data does NOT guarantee future results.</li>
                      <li><strong>No Guarantees:</strong> We make NO warranties about accuracy, completeness, or profitability of any information.</li>
                    </ul>
                    <p className="font-bold text-red-200">
                      BY USING THIS PLATFORM, YOU ACKNOWLEDGE THAT YOU ARE SOLELY RESPONSIBLE FOR YOUR INVESTMENT DECISIONS 
                      AND AGREE TO HOLD AICAPITAL HARMLESS FROM ANY LOSSES.
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-red-200 hover:text-white underline mt-1 font-semibold"
              >
                {isExpanded ? '▲ Show Less' : '▼ Read Full Disclaimer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
