'use client';

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
  animate?: boolean;
}

export default function SkeletonLoader({ 
  className = '', 
  lines = 1, 
  height = 'h-4', 
  width = 'w-full',
  animate = true 
}: SkeletonLoaderProps) {
  const baseClasses = `bg-slate-700 rounded ${height} ${width}`;
  const animationClasses = animate ? 'animate-pulse' : '';
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${animationClasses}`}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

// Predefined skeleton components for common use cases
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <SkeletonLoader lines={3} height="h-4" className="mb-4" />
      <SkeletonLoader lines={1} height="h-8" width="w-24" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <SkeletonLoader lines={1} height="h-6" width="w-48" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex space-x-4">
            <SkeletonLoader height="h-4" width="w-16" />
            <SkeletonLoader height="h-4" width="w-24" />
            <SkeletonLoader height="h-4" width="w-20" />
            <SkeletonLoader height="h-4" width="w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <SkeletonLoader lines={1} height="h-6" width="w-48" className="mb-4" />
      <div className="h-64 bg-slate-700 rounded animate-pulse flex items-end justify-center space-x-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="bg-slate-600 rounded-t"
            style={{
              height: `${Math.random() * 60 + 20}%`,
              width: '12%',
              animationDelay: `${index * 100}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function PortfolioCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <SkeletonLoader height="h-5" width="w-24" />
        <SkeletonLoader height="h-4" width="w-16" />
      </div>
      <div className="space-y-2">
        <SkeletonLoader height="h-4" width="w-full" />
        <SkeletonLoader height="h-4" width="w-3/4" />
        <SkeletonLoader height="h-4" width="w-1/2" />
      </div>
      <div className="mt-4 flex justify-between">
        <SkeletonLoader height="h-8" width="w-20" />
        <SkeletonLoader height="h-8" width="w-16" />
      </div>
    </div>
  );
}

export function NotificationSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-lg p-4 border-l-4 border-blue-500 ${className}`}>
      <div className="flex items-start space-x-3">
        <SkeletonLoader height="h-8" width="w-8" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader height="h-4" width="w-48" />
          <SkeletonLoader height="h-3" width="w-full" />
          <SkeletonLoader height="h-3" width="w-3/4" />
        </div>
        <SkeletonLoader height="h-4" width="w-12" />
      </div>
    </div>
  );
}
