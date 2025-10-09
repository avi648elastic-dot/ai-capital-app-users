'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors duration-200 border border-slate-600 hover:border-slate-500 [data-theme='light']:bg-gray-200 [data-theme='light']:hover:bg-gray-300 [data-theme='light']:text-gray-800 [data-theme='light']:border-gray-300 [data-theme='light']:hover:border-gray-400"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
