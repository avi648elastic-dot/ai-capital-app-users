/**
 * 🔢 AI-Capital Unified Number Formatters
 * Consistent formatting across the entire application
 */

export type Locale = 'en' | 'ar' | 'he';

// Currency formatting with proper locale support
export const formatCurrency = (value: number, locale: Locale = 'en', currency: string = 'USD'): string => {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA', 
    he: 'he-IL'
  };

  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    // Fallback to simple formatting
    return `$${value.toFixed(2)}`;
  }
};

// Percentage formatting with proper locale support
export const formatPercent = (value: number, locale: Locale = 'en', decimals: number = 2): string => {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL'
  };

  try {
    const formatted = new Intl.NumberFormat(localeMap[locale], {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);

    // Add + sign for positive values
    return value >= 0 ? `+${formatted}` : formatted;
  } catch (error) {
    // Fallback to simple formatting
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }
};

// Number formatting with proper locale support
export const formatNumber = (value: number, locale: Locale = 'en', decimals: number = 0): string => {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL'
  };

  try {
    return new Intl.NumberFormat(localeMap[locale], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    // Fallback to simple formatting
    return value.toFixed(decimals);
  }
};

// Large number formatting (K, M, B notation)
export const formatLargeNumber = (value: number, locale: Locale = 'en'): string => {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL'
  };

  try {
    if (Math.abs(value) >= 1e9) {
      return new Intl.NumberFormat(localeMap[locale], {
        style: 'decimal',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    } else if (Math.abs(value) >= 1e6) {
      return new Intl.NumberFormat(localeMap[locale], {
        style: 'decimal',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    } else if (Math.abs(value) >= 1e3) {
      return new Intl.NumberFormat(localeMap[locale], {
        style: 'decimal',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    } else {
      return formatNumber(value, locale, 2);
    }
  } catch (error) {
    // Fallback formatting
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    } else {
      return value.toFixed(2);
    }
  }
};

// Date formatting with proper locale support
export const formatDate = (date: Date | string, locale: Locale = 'en'): string => {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL'
  };

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(localeMap[locale], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    // Fallback to simple formatting
    return dateObj.toLocaleDateString();
  }
};

// Time formatting with proper locale support
export const formatTime = (date: Date | string, locale: Locale = 'en'): string => {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL'
  };

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(localeMap[locale], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: locale === 'en' // 12-hour format for English, 24-hour for Arabic/Hebrew
    }).format(dateObj);
  } catch (error) {
    // Fallback to simple formatting
    return dateObj.toLocaleTimeString();
  }
};

// Price change formatting with color classes
export const formatPriceChange = (value: number, locale: Locale = 'en'): { text: string; colorClass: string } => {
  const formatted = formatPercent(value, locale, 2);
  
  if (value > 0) {
    return {
      text: formatted,
      colorClass: 'text-emerald-400 [data-theme="light"]:text-emerald-600'
    };
  } else if (value < 0) {
    return {
      text: formatted,
      colorClass: 'text-red-400 [data-theme="light"]:text-red-600'
    };
  } else {
    return {
      text: formatted,
      colorClass: 'text-slate-400 [data-theme="light"]:text-gray-600'
    };
  }
};

// Portfolio value formatting
export const formatPortfolioValue = (value: number, locale: Locale = 'en'): string => {
  if (Math.abs(value) >= 1e6) {
    return formatCurrency(value, locale);
  } else {
    return formatCurrency(value, locale);
  }
};

// Stock price formatting (always 2 decimals for stocks)
export const formatStockPrice = (value: number, locale: Locale = 'en'): string => {
  return formatCurrency(value, locale);
};

// Share quantity formatting (whole numbers)
export const formatShares = (value: number, locale: Locale = 'en'): string => {
  return formatNumber(value, locale, 0);
};

// Weight formatting (for portfolio allocation)
export const formatWeight = (value: number, locale: Locale = 'en'): string => {
  return formatPercent(value, locale, 1);
};

// Duration formatting (for time periods)
export const formatDuration = (days: number): string => {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
};

// Utility function to get color class based on value
export const getValueColorClass = (value: number, type: 'price' | 'percent' = 'price'): string => {
  if (type === 'percent') {
    if (value > 0) {
      return 'text-emerald-400 [data-theme="light"]:text-emerald-600';
    } else if (value < 0) {
      return 'text-red-400 [data-theme="light"]:text-red-600';
    } else {
      return 'text-slate-400 [data-theme="light"]:text-gray-600';
    }
  } else {
    // For prices, we don't typically show colors (just positive/negative)
    if (value < 0) {
      return 'text-red-400 [data-theme="light"]:text-red-600';
    } else {
      return 'text-white [data-theme="light"]:text-gray-900';
    }
  }
};

// Export default formatter configuration
export const DEFAULT_FORMATTERS = {
  currency: formatCurrency,
  percent: formatPercent,
  number: formatNumber,
  largeNumber: formatLargeNumber,
  date: formatDate,
  time: formatTime,
  priceChange: formatPriceChange,
  portfolioValue: formatPortfolioValue,
  stockPrice: formatStockPrice,
  shares: formatShares,
  weight: formatWeight,
  duration: formatDuration,
  getValueColorClass
};

export default DEFAULT_FORMATTERS;
