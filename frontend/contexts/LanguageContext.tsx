'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  LanguageContextType, 
  SupportedLanguage, 
  detectUserLanguage,
  getLanguageConfig,
  isRTL,
  getFontFamily
} from '@/lib/i18n';
import { translations } from '@/lib/translations';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Initialize language on mount
  useEffect(() => {
    const detectedLanguage = detectUserLanguage();
    setLanguageState(detectedLanguage);
    
    // Apply language-specific styles
    applyLanguageStyles(detectedLanguage);
  }, []);

  // Apply language-specific styles to document
  const applyLanguageStyles = (lang: SupportedLanguage) => {
    if (typeof document === 'undefined') return;

    const config = getLanguageConfig(lang);
    
    // Set document direction
    document.documentElement.dir = config.direction;
    document.documentElement.lang = lang;
    
    // Set font family
    document.body.style.fontFamily = config.fontFamily;
    
    // Add language class for CSS targeting
    document.documentElement.className = document.documentElement.className
      .replace(/lang-\w+/g, '')
      .trim();
    document.documentElement.classList.add(`lang-${lang}`);
    
    // Apply RTL-specific styles
    if (isRTL(lang)) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };

  // Set language function
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('aicapital-language', lang);
    applyLanguageStyles(lang);
    
    // Trigger a custom event for other components to listen
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  };

  // Translation function
  const t = (key: string, params: Record<string, string | number> = {}): string => {
    const keys = key.split('.');
    let translation: any = translations[language];
    
    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        console.warn(`Translation key "${key}" not found for language "${language}"`);
        return key; // Return the key if translation not found
      }
    }
    
    if (typeof translation === 'string') {
      // Interpolate parameters
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    console.warn(`Translation key "${key}" is not a string for language "${language}"`);
    return key;
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    direction: getLanguageConfig(language).direction,
    isRTL: isRTL(language),
    fontFamily: getFontFamily(language)
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for RTL-aware styling
export function useRTL() {
  const { isRTL, direction } = useLanguage();
  
  return {
    isRTL,
    direction,
    textAlign: isRTL ? 'right' : 'left',
    flexDirection: isRTL ? 'row-reverse' : 'row',
    marginStart: isRTL ? 'marginRight' : 'marginLeft',
    marginEnd: isRTL ? 'marginLeft' : 'marginRight',
    paddingStart: isRTL ? 'paddingRight' : 'paddingLeft',
    paddingEnd: isRTL ? 'paddingLeft' : 'paddingRight',
    borderStart: isRTL ? 'borderRight' : 'borderLeft',
    borderEnd: isRTL ? 'borderLeft' : 'borderRight'
  };
}

// Component for conditional RTL/LTR rendering
interface DirectionalProps {
  children: ReactNode;
  className?: string;
}

export function RTLWrapper({ children, className = '' }: DirectionalProps) {
  const { isRTL } = useLanguage();
  
  return (
    <div className={`${className} ${isRTL ? 'rtl' : 'ltr'}`}>
      {children}
    </div>
  );
}