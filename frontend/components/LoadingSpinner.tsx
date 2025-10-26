'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto ${sizeClasses[size]}`}></div>
        <p className="mt-4 text-slate-400">{message}</p>
      </div>
    </div>
  );
}
