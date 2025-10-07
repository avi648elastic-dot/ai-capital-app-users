'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Step0 from '@/components/onboarding/Step0';
import Step1 from '@/components/onboarding/Step1';
import Step2a from '@/components/onboarding/Step2a';
import Step2b from '@/components/onboarding/Step2b';

interface OnboardingStatus {
  onboardingCompleted: boolean;
  portfolioType?: string;
  portfolioSource?: string;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      if (response.data.onboardingCompleted) {
        router.push('/dashboard');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  const handleStep0Complete = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(1);
  };

  const handleStep1Complete = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(2);
  };

  const handleStep2aComplete = (data: any) => {
    // Portfolio imported - redirect to dashboard immediately
    console.log('✅ [ONBOARDING] Step2a completed, redirecting to dashboard');
    window.location.href = '/dashboard';
  };

  const handleStep2bComplete = (data: any) => {
    // Portfolio generated - redirect to dashboard immediately  
    console.log('✅ [ONBOARDING] Step2b completed, redirecting to dashboard');
    window.location.href = '/dashboard';
  };


  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to AiCapital</h1>
          <p className="text-gray-400">Let's set up your personalized portfolio</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (step < currentStep) setCurrentStep(step);
                  }}
                  title={step < currentStep ? 'Go back to this step' : ''}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  } ${step < currentStep ? 'hover:bg-primary-500 cursor-pointer' : 'cursor-default'}`}
                >
                  {step + 1}
                </button>
                {step < 2 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of 3
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="card p-8">
          {currentStep === 0 && (
            <Step0 onComplete={handleStep0Complete} />
          )}
          
          {currentStep === 1 && (
            <Step1 onComplete={handleStep1Complete} />
          )}
          
          {currentStep === 2 && onboardingData.hasExistingPortfolio === true && (
            <Step2a onComplete={handleStep2aComplete} onBack={goBack} />
          )}
          
          {currentStep === 2 && onboardingData.hasExistingPortfolio === false && (
            <Step2b onComplete={handleStep2bComplete} onBack={goBack} />
          )}
        </div>
      </div>
    </div>
  );
}
