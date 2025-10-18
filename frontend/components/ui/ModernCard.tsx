'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  hover = true,
  onClick,
  icon: Icon,
  title,
  subtitle,
  value,
  trend,
  loading = false
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: 'bg-white/10 backdrop-blur-lg border border-white/20',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-400/30',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
    neon: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-cyan-400/50 shadow-lg shadow-cyan-500/25'
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const CardComponent = onClick ? motion.button : motion.div;

  return (
    <CardComponent
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${hover ? 'hover:bg-white/20 transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        rounded-2xl
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-8 bg-white/20 rounded w-1/2"></div>
          <div className="h-3 bg-white/20 rounded w-1/4"></div>
        </div>
      ) : (
        <>
          {(Icon || title || subtitle || value) && (
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {Icon && (
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-300">{subtitle}</p>
                  )}
                </div>
              </div>
              {value && (
                <div className="text-right">
                  <div className={`text-2xl font-bold ${trend ? trendColors[trend] : 'text-white'}`}>
                    {value}
                  </div>
                  {trend && (
                    <div className={`text-sm ${trendColors[trend]}`}>
                      {trend === 'up' && '↗'}
                      {trend === 'down' && '↘'}
                      {trend === 'neutral' && '→'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {children}
        </>
      )}
    </CardComponent>
  );
};

export default ModernCard;
