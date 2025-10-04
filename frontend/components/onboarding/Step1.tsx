'use client';

import { useState } from 'react';
import { ArrowRight, Upload, Sparkles } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Step1Props {
  onComplete: (data: any) => void;
}

export default function Step1({ onComplete }: Step1Props) {
  const [hasExistingPortfolio, setHasExistingPortfolio] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (hasPortfolio: boolean) => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        alert('אנא התחבר קודם! לחץ על "Sign Up" או "Login" בדף הראשי');
        window.location.href = '/';
        return;
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/check-existing`, {
        hasExistingPortfolio: hasPortfolio,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onComplete({ hasExistingPortfolio: hasPortfolio });
} catch (error) {
  const err = error as any; // ✅ תיקון חובה ל-TypeScript
  console.error('Error saving portfolio preference:', err);
  alert('Error: ' + (err?.response?.data?.message || 'Something went wrong'));
} finally {

      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">
        Do you already have an existing portfolio?
      </h2>
      <p className="text-gray-400 mb-8">
        We can help you import your current holdings or create a new AI-powered portfolio from scratch.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Yes - Import Portfolio */}
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="card p-8 text-left hover:bg-gray-750 transition-colors group"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Yes, Import My Portfolio</h3>
          </div>
          <p className="text-gray-400 mb-4">
            I have existing stock holdings that I want to track and get AI recommendations for.
          </p>
          <div className="flex items-center text-primary-400 group-hover:text-primary-300">
            <span className="text-sm font-medium">Import Portfolio</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </button>

        {/* No - Create New */}
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="card p-8 text-left hover:bg-gray-750 transition-colors group"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-success-600 rounded-lg flex items-center justify-center mr-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">No, Create New Portfolio</h3>
          </div>
          <p className="text-gray-400 mb-4">
            I want to start fresh with an AI-generated portfolio tailored to my risk preferences.
          </p>
          <div className="flex items-center text-success-400 group-hover:text-success-300">
            <span className="text-sm font-medium">Create New</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </button>
      </div>

      {loading && (
        <div className="mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Processing...</p>
        </div>
      )}
    </div>
  );
}
