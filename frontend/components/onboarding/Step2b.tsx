'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Zap } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface Step2bProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function Step2b({ onComplete, onBack }: Step2bProps) {
  const [portfolioType, setPortfolioType] = useState<'solid' | 'dangerous' | null>(null);
  const [totalCapital, setTotalCapital] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('7');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!portfolioType) {
      alert('Please select a portfolio type');
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 [STEP2B] Generating portfolio...', { portfolioType, totalCapital, riskTolerance });
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/generate-portfolio`, {
        portfolioType,
        totalCapital: Number(totalCapital),
        riskTolerance: Number(riskTolerance),
      }, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ [STEP2B] Portfolio generated successfully:', response.data);

      // Validate response data
      if (!response.data || !response.data.portfolio) {
        console.error('❌ [STEP2B] Invalid response data:', response.data);
        throw new Error('Invalid portfolio data received from server');
      }

      console.log('✅ [STEP2B] Portfolio data validated:', response.data.portfolio.length, 'stocks');

      // Skip Step3 - go directly to dashboard
      console.log('✅ [STEP2B] Portfolio generated successfully, redirecting to dashboard...');
      
      // Show success message and redirect
      alert('Portfolio generated successfully! Redirecting to dashboard...');
      
      // Use Next.js router for navigation
      setTimeout(() => {
        try {
          router.push('/dashboard');
        } catch (error) {
          console.error('❌ [STEP2B] Router error:', error);
          // Fallback: try to call onComplete
          onComplete(response.data);
        }
      }, 1500);
    } catch (error) {
      console.error('❌ [STEP2B] Error generating portfolio:', error);
      console.error('❌ [STEP2B] Error details:', error.response?.data);
      alert(`Error generating portfolio: ${error.response?.data?.message || error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-white">Create AI Portfolio</h2>
      </div>

      <p className="text-gray-400 mb-8">
        Choose your portfolio type and investment amount. Our AI will automatically select and allocate stocks based on your preferences.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Portfolio Type Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Choose Your Portfolio Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solid Portfolio */}
            <button
              type="button"
              onClick={() => setPortfolioType('solid')}
              className={`card p-6 text-left transition-colors ${
                portfolioType === 'solid'
                  ? 'ring-2 ring-primary-500 bg-primary-900/20'
                  : 'hover:bg-gray-750'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Solid Portfolio</h4>
              </div>
              <p className="text-gray-400 mb-4">
                Conservative approach with stable, large-cap stocks. Lower risk, steady growth potential.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className="text-success-400">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility:</span>
                  <span className="text-success-400">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-success-400">6-12% annually</span>
                </div>
              </div>
            </button>

            {/* Dangerous Portfolio */}
            <button
              type="button"
              onClick={() => setPortfolioType('dangerous')}
              className={`card p-6 text-left transition-colors ${
                portfolioType === 'dangerous'
                  ? 'ring-2 ring-danger-500 bg-danger-900/20'
                  : 'hover:bg-gray-750'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-danger-600 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Dangerous Portfolio</h4>
              </div>
              <p className="text-gray-400 mb-4">
                Aggressive approach with high-growth, volatile stocks. Higher risk, higher potential returns.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className="text-danger-400">High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility:</span>
                  <span className="text-danger-400">High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-danger-400">15-30% annually</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Investment Settings */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Investment Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Investment Amount ($)
              </label>
              <input
                type="number"
                value={totalCapital}
                onChange={(e) => setTotalCapital(e.target.value)}
                className="input-field"
                placeholder="e.g., 10000"
                min="1000"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum $1,000 to generate a diversified portfolio
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Tolerance (%)
              </label>
              <input
                type="number"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="input-field"
                placeholder="e.g., 7"
                min="1"
                max="20"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Determines stop loss and take profit levels (1-20%)
              </p>
            </div>
          </div>
        </div>

        {/* AI Features Preview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">AI Features Included</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-gray-300">Automatic stock selection</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-gray-300">Risk-weighted allocation</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-gray-300">Auto-calculated stop losses</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-gray-300">Real-time BUY/HOLD/SELL signals</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={loading || !portfolioType}
          >
            {loading ? 'Generating...' : 'Generate Portfolio'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
}
