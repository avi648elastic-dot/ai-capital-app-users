'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'blue' | 'green' | 'yellow';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    white: 'border-white',
    blue: 'border-blue-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`animate-spin rounded-full border-2 border-transparent ${sizeClasses[size]} ${colorClasses[color]} border-t-current`}
        />
        {text && (
          <p className="text-sm text-slate-400 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Predefined loading states for common use cases
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export function CardLoading({ text }: { text?: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-8 text-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <LoadingSpinner size={size} color="white" />
  );
}

export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm text-slate-400">{text}</span>}
    </div>
  );
}
