'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
        { credential }
      );

      const { token, user } = response.data;

      // Set cookie
      Cookies.set('token', token, {
        expires: 7,
        secure: true,
        sameSite: 'None',
      });

      // Redirect based on onboarding status
      if (user.onboardingCompleted) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.message || 'Google login failed';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleSignIn = () => {
    // Check if Google Client ID is properly configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('your-google-client-id')) {
      console.warn('Google OAuth not configured - client ID missing or placeholder');
      return;
    }

    console.log('🔑 [GOOGLE OAUTH] Initializing with Client ID:', clientId);

    if (typeof window !== 'undefined' && window.google) {
      try {
        console.log('✅ [GOOGLE OAUTH] Google SDK loaded, initializing...');
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            console.log('🔐 [GOOGLE OAUTH] User signed in, credential received');
            handleGoogleLogin(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          console.log('🎨 [GOOGLE OAUTH] Rendering Google button...');
          window.google.accounts.id.renderButton(
            buttonElement,
            {
              theme: 'outline',
              size: 'large',
              width: buttonElement.offsetWidth || 300,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          );
          console.log('✅ [GOOGLE OAUTH] Button rendered successfully');
        } else {
          console.error('❌ [GOOGLE OAUTH] Button container not found');
        }
      } catch (error) {
        console.error('❌ [GOOGLE OAUTH] Initialization error:', error);
      }
    } else {
      console.warn('⚠️ [GOOGLE OAUTH] Google SDK not loaded yet');
    }
  };

  // Load Google Identity Services script
  const loadGoogleScript = () => {
    if (document.getElementById('google-script')) {
      console.log('⏭️ [GOOGLE OAUTH] Script already loaded');
      // If script exists but Google not initialized, try initializing
      if (window.google) {
        initializeGoogleSignIn();
      }
      return;
    }

    console.log('📥 [GOOGLE OAUTH] Loading Google SDK script...');
    const script = document.createElement('script');
    script.id = 'google-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ [GOOGLE OAUTH] Script loaded successfully');
      // Wait a bit for Google SDK to fully initialize
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 100);
    };
    script.onerror = () => {
      console.error('❌ [GOOGLE OAUTH] Failed to load Google SDK script');
    };
    document.head.appendChild(script);
  };

  // Initialize on component mount
  React.useEffect(() => {
    console.log('🚀 [GOOGLE OAUTH] Component mounted, loading script...');
    loadGoogleScript();
    
    // Retry initialization after 1 second if Google SDK not ready
    const retryTimer = setTimeout(() => {
      if (window.google && !document.getElementById('google-signin-button')?.querySelector('iframe')) {
        console.log('🔄 [GOOGLE OAUTH] Retrying initialization...');
        initializeGoogleSignIn();
      }
    }, 1000);
    
    return () => clearTimeout(retryTimer);
  }, []);

  // Check if Google OAuth is properly configured
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isGoogleOAuthConfigured = clientId && !clientId.includes('your-google-client-id');

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
        </div>
      </div>

      <div className="mt-6">
        <div
          id="google-signin-button"
          className="w-full flex justify-center"
          style={{ minHeight: '44px' }}
        >
          {/* Fallback button if Google script fails to load */}
          <button
            onClick={() => loadGoogleScript()}
            disabled={loading || !isGoogleOAuthConfigured}
            className={`w-full flex items-center justify-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isGoogleOAuthConfigured 
                ? 'border-slate-600 bg-white text-gray-700 hover:bg-gray-50' 
                : 'border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed'
            } disabled:opacity-50`}
            title={!isGoogleOAuthConfigured ? 'Google OAuth setup required. Contact admin to configure Google Client ID.' : ''}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Signing in...' : isGoogleOAuthConfigured ? 'Continue with Google' : 'Google Login (Setup Required)'}
          </button>
        </div>
      </div>
    </div>
  );
}
