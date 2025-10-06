'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Step1 from '@/components/onboarding/Step1';
import Step2a from '@/components/onboarding/Step2a';
import Step2b from '@/components/onboarding/Step2b';
import Step3 from '@/components/onboarding/Step3';

interface OnboardingStatus {
  onboardingCompleted: boolean;
  portfolioType?: string;
  portfolioSource?: string;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${https://ai-capital-app7.onrender.com}/api/onboarding/status`, {
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

  const handleStep1Complete = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(2);
  };

  const handleStep2aComplete = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(3);
  };

  const handleStep2bComplete = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(3);
  };

  const handleStep3Complete = () => {
    router.push('/dashboard');
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
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
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
              Step {currentStep} of 3
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="card p-8">
          {currentStep === 1 && (
            <Step1 onComplete={handleStep1Complete} />
          )}
          
          {currentStep === 2 && onboardingData.hasExistingPortfolio === true && (
            <Step2a onComplete={handleStep2aComplete} onBack={goBack} />
          )}
          
          {currentStep === 2 && onboardingData.hasExistingPortfolio === false && (
            <Step2b onComplete={handleStep2bComplete} onBack={goBack} />
          )}
          
          {currentStep === 3 && (
            <Step3 
              onboardingData={onboardingData} 
              onComplete={handleStep3Complete} 
              onBack={goBack} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
