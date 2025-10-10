'use client';

import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeApplier() {
  const { theme } = useTheme();

  useEffect(() => {
    console.log('🎨 Theme changing to:', theme);
    
    // Apply theme to html element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also apply theme classes to html for better compatibility
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    
    console.log('🎨 HTML data-theme:', document.documentElement.getAttribute('data-theme'));
    console.log('🎨 HTML classes:', document.documentElement.className);
  }, [theme]);

  return null; // This component doesn't render anything
}
