'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  // Simple clean background - NO ANIMATIONS to prevent headaches
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Clean empty background - animations removed to prevent visual fatigue */}
    </div>
  );
}