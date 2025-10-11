'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    // VIBRATE on toast show - MAJOR'S REQUIREMENT
    if ('vibrate' in navigator) {
      if (type === 'error') {
        navigator.vibrate([200, 100, 200]); // Error: double buzz
      } else if (type === 'success') {
        navigator.vibrate([100, 50, 100]); // Success: quick buzz
      } else if (type === 'warning') {
        navigator.vibrate([150, 50, 150, 50, 150]); // Warning: triple buzz
      } else {
        navigator.vibrate(50); // Info: single buzz
      }
    }

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, type]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    error: <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    warning: <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    info: <Info className="w-5 h-5 sm:w-6 sm:h-6" />
  };

  const styles = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-red-600 text-white border-red-500',
    warning: 'bg-yellow-600 text-white border-yellow-500',
    info: 'bg-blue-600 text-white border-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto z-[9999] animate-toast-slide-in`}>
      <div className={`${styles[type]} border-l-4 rounded-lg shadow-2xl p-4 pr-12 min-w-[280px] sm:min-w-[300px] max-w-md mx-auto sm:mx-0`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="flex-1">
            <p className="text-sm sm:text-base font-medium leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20 active:scale-95"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {children}
    </div>
  );
}

