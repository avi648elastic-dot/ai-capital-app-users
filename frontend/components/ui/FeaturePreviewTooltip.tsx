'use client';

import { useState } from 'react';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface FeaturePreviewTooltipProps {
  featureName: string;
  description: string;
  requiredTier: 'premium' | 'premium+';
  previewImage?: string;
  children: React.ReactNode;
}

export default function FeaturePreviewTooltip({
  featureName,
  description,
  requiredTier,
  previewImage,
  children
}: FeaturePreviewTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  const tierColors = {
    premium: {
      bg: 'from-blue-500 to-cyan-500',
      text: 'text-blue-400',
      badge: 'bg-blue-500'
    },
    'premium+': {
      bg: 'from-purple-500 to-pink-500',
      text: 'text-purple-400',
      badge: 'bg-purple-500'
    }
  };

  const tierInfo = tierColors[requiredTier];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute left-full ml-4 top-0 z-[100] w-80 animate-fade-in">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Preview Image */}
            {previewImage ? (
              <div className="relative h-40 bg-slate-900">
                <Image
                  src={previewImage}
                  alt={featureName}
                  fill
                  className="object-cover opacity-80"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${tierInfo.bg} opacity-20`} />
              </div>
            ) : (
              <div className={`h-40 bg-gradient-to-br ${tierInfo.bg} opacity-20 flex items-center justify-center`}>
                <Lock className="w-16 h-16 text-slate-600" />
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {/* Feature Name */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">{featureName}</h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${tierInfo.badge} text-white text-xs font-bold`}>
                  <Crown className="w-3 h-3" />
                  {requiredTier === 'premium+' ? 'Premium+' : 'Premium'}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                {description}
              </p>

              {/* Upgrade CTA */}
              <div className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${tierInfo.bg} bg-opacity-10 border border-slate-700`}>
                <span className={`text-sm font-semibold ${tierInfo.text}`}>
                  Upgrade to unlock
                </span>
                <ArrowRight className={`w-4 h-4 ${tierInfo.text}`} />
              </div>
            </div>

            {/* Arrow pointing to the button */}
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-700" />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
