'use client';

import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { X, Shield, AlertTriangle, Plus } from 'lucide-react';

interface CreatePortfolioModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePortfolioModal({ onClose, onSuccess }: CreatePortfolioModalProps) {
  console.log('🔍 [CREATE PORTFOLIO MODAL] Modal component rendered');
  const [portfolioType, setPortfolioType] = useState<'solid' | 'risky' | ''>('');
  const [portfolioName, setPortfolioName] = useState('');
  const [initialInvestment, setInitialInvestment] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('7');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    console.log('🔍 [CREATE PORTFOLIO] handleCreate called');
    console.log('🔍 [CREATE PORTFOLIO] portfolioType:', portfolioType);
    console.log('🔍 [CREATE PORTFOLIO] initialInvestment:', initialInvestment);
    console.log('🔍 [CREATE PORTFOLIO] riskTolerance:', riskTolerance);
    
    if (!portfolioType) {
      console.log('❌ [CREATE PORTFOLIO] No portfolio type selected');
      alert('Please select a portfolio type');
      return;
    }

    if (!initialInvestment || isNaN(Number(initialInvestment)) || Number(initialInvestment) <= 0) {
      console.log('❌ [CREATE PORTFOLIO] Invalid initial investment:', initialInvestment);
      alert('Please enter a valid initial investment amount');
      return;
    }

    console.log('🔍 [CREATE PORTFOLIO] Starting portfolio creation...');
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portfolios/create`,
        { 
          portfolioType,
          portfolioName: portfolioName.trim() || undefined,
          initialInvestment: Number(initialInvestment),
          riskTolerance: Number(riskTolerance)
        },
        { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
      );
      
          if (response.data.success) {
            const stocksCount = response.data.stocksCount || 0;
            alert(`Portfolio created successfully! Generated ${stocksCount} AI-selected stocks with $${Number(initialInvestment).toLocaleString()} investment.`);
            onSuccess();
          }
    } catch (error: any) {
      console.error('Error creating portfolio:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create portfolio';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Creating Portfolio...</h3>
            <p className="text-slate-400">Please wait while we set up your new portfolio</p>
          </div>
        </div>
      )}
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-400" />
            Create New Portfolio
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Portfolio Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose Portfolio Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setPortfolioType('solid')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  portfolioType === 'solid'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-blue-400 hover:bg-blue-500/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <div className="text-left">
                    <div className="text-lg font-semibold">Solid Portfolio</div>
                    <div className="text-sm text-slate-400">
                      Low risk, stable investments with steady growth
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      Recommended for conservative investors
                    </div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setPortfolioType('risky')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  portfolioType === 'risky'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-orange-400 hover:bg-orange-500/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  <div className="text-left">
                    <div className="text-lg font-semibold">Risky Portfolio</div>
                    <div className="text-sm text-slate-400">
                      High risk, high reward investments with growth potential
                    </div>
                    <div className="text-xs text-orange-400 mt-1">
                      For experienced investors comfortable with volatility
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Portfolio Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Portfolio Name (Optional)
            </label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder={`e.g., My ${portfolioType || 'New'} Portfolio`}
              className="w-full input-field"
              maxLength={50}
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave empty to use default name: "{portfolioType} Portfolio {portfolioType ? 'X' : ''}"
            </p>
          </div>

          {/* Initial Investment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Investment Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                placeholder="10000"
                className="w-full input-field pl-8"
                min="1"
                step="0.01"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enter the amount you want to invest in this portfolio
            </p>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk Tolerance: {riskTolerance}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Conservative (1)</span>
              <span>Aggressive (10)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              This determines stop-loss and take-profit levels for your stocks
            </p>
          </div>


          {/* Premium Limits Info */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-sm text-slate-300">
              <div className="font-semibold text-blue-400 mb-1">Premium Portfolio Limits:</div>
              <div className="text-xs space-y-1">
                <div>• Up to 3 Solid portfolios</div>
                <div>• Up to 3 Risky portfolios</div>
                <div>• 15 stocks per portfolio</div>
                <div>• Real-time market data & AI analysis</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-600">
                <div className="font-semibold text-purple-400 mb-1">Premium+ (Coming Soon):</div>
                <div className="text-xs space-y-1 text-slate-400">
                  <div>• Up to 5 Solid portfolios</div>
                  <div>• Up to 5 Risky portfolios</div>
                  <div>• 20 stocks per portfolio</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('🔍 [CREATE PORTFOLIO] Button clicked');
                console.log('🔍 [CREATE PORTFOLIO] Button disabled?', !portfolioType || !initialInvestment || loading);
                handleCreate();
              }}
              disabled={!portfolioType || !initialInvestment || loading}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Portfolio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
