'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Volume2, VolumeX, Type, TypeOff } from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

export default function AccessibilityEnhancements() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: false,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text mode
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [settings]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!settings.keyboardNavigation) return;

      // Skip links for keyboard navigation
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }

      // Escape key to close modals
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
          if (modal.getAttribute('aria-hidden') === 'false') {
            (modal as HTMLElement).click();
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation]);

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <>
      {/* Accessibility Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div 
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-hidden={!isOpen}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="accessibility-title" className="text-lg font-semibold text-white">
              Accessibility Settings
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-all"
              aria-label="Close accessibility settings"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* High Contrast Mode */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">High Contrast</label>
                <p className="text-xs text-slate-400">Increase contrast for better visibility</p>
              </div>
              <button
                onClick={() => toggleSetting('highContrast')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.highContrast}
                aria-label="Toggle high contrast mode"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.highContrast ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Large Text Mode */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">Large Text</label>
                <p className="text-xs text-slate-400">Increase text size for better readability</p>
              </div>
              <button
                onClick={() => toggleSetting('largeText')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.largeText ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.largeText}
                aria-label="Toggle large text mode"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.largeText ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">Reduced Motion</label>
                <p className="text-xs text-slate-400">Minimize animations and transitions</p>
              </div>
              <button
                onClick={() => toggleSetting('reducedMotion')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.reducedMotion ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.reducedMotion}
                aria-label="Toggle reduced motion"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.reducedMotion ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Focus Visible */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">Enhanced Focus</label>
                <p className="text-xs text-slate-400">Make focus indicators more visible</p>
              </div>
              <button
                onClick={() => toggleSetting('focusVisible')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.focusVisible ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.focusVisible}
                aria-label="Toggle enhanced focus indicators"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.focusVisible ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Keyboard Navigation */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">Keyboard Navigation</label>
                <p className="text-xs text-slate-400">Enhanced keyboard support</p>
              </div>
              <button
                onClick={() => toggleSetting('keyboardNavigation')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.keyboardNavigation ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.keyboardNavigation}
                aria-label="Toggle keyboard navigation"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.keyboardNavigation ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-white mb-2">Keyboard Shortcuts</h3>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Skip to main content</span>
                <kbd className="px-1 py-0.5 bg-slate-600 rounded text-xs">Alt + M</kbd>
              </div>
              <div className="flex justify-between">
                <span>Open accessibility panel</span>
                <kbd className="px-1 py-0.5 bg-slate-600 rounded text-xs">Alt + A</kbd>
              </div>
              <div className="flex justify-between">
                <span>Close modal</span>
                <kbd className="px-1 py-0.5 bg-slate-600 rounded text-xs">Escape</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// CSS classes for accessibility features
export const accessibilityStyles = `
  .high-contrast {
    --tw-bg-opacity: 1;
    --tw-text-opacity: 1;
  }
  
  .high-contrast .bg-slate-800 {
    background-color: #000000 !important;
  }
  
  .high-contrast .text-slate-300 {
    color: #ffffff !important;
  }
  
  .high-contrast .text-slate-400 {
    color: #cccccc !important;
  }
  
  .large-text {
    font-size: 1.125rem;
  }
  
  .large-text .text-sm {
    font-size: 1rem;
  }
  
  .large-text .text-xs {
    font-size: 0.875rem;
  }
  
  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .focus-visible *:focus {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px !important;
  }
  
  .focus-visible button:focus,
  .focus-visible [role="button"]:focus {
    box-shadow: 0 0 0 2px #3b82f6 !important;
  }
`;
