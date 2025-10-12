'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swrConfig';

interface SWRProviderProps {
  children: React.ReactNode;
}

/**
 * 🔄 SWR Provider Component
 * 
 * Wraps the entire app with SWR configuration for data fetching and caching
 * Provides global error handling, loading states, and cache management
 */
export default function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
