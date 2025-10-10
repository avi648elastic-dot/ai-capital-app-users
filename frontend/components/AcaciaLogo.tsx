import React from 'react';

interface AcaciaLogoProps {
  className?: string;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
}

const AcaciaLogo: React.FC<AcaciaLogoProps> = ({ className = '', size = 'md' }) => {
  // Handle both number and string sizes
  const getSize = () => {
    if (typeof size === 'number') return size;
    const sizeMap = {
      sm: 24,
      md: 32,
      lg: 48,
      xl: 64
    };
    return sizeMap[size];
  };

  const logoSize = getSize();

  return (
    <div className={`${className}`} style={{ width: logoSize, height: logoSize }}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* AI-Capital Acacia Tree Logo - Exact Design */}
        <g fill="#8B6232">
          {/* Main Trunk - Wide triangular base */}
          <path d="M45 85 L55 85 L52 70 L48 70 Z" />
          
          {/* Central trunk extension */}
          <rect x="48" y="70" width="4" height="15" />
          
          {/* Main Branch Structure - Symmetrical and organic */}
          {/* Left side branches */}
          <path d="M50 70 Q40 65 32 60 Q25 55 20 50" stroke="#8B6232" strokeWidth="1.5" fill="none" />
          <path d="M50 68 Q38 62 30 57 Q23 52 18 47" stroke="#8B6232" strokeWidth="1.2" fill="none" />
          <path d="M50 66 Q36 59 28 54 Q21 49 16 44" stroke="#8B6232" strokeWidth="1" fill="none" />
          <path d="M50 64 Q34 56 26 51 Q19 46 14 41" stroke="#8B6232" strokeWidth="0.8" fill="none" />
          
          {/* Right side branches */}
          <path d="M50 70 Q60 65 68 60 Q75 55 80 50" stroke="#8B6232" strokeWidth="1.5" fill="none" />
          <path d="M50 68 Q62 62 70 57 Q77 52 82 47" stroke="#8B6232" strokeWidth="1.2" fill="none" />
          <path d="M50 66 Q64 59 72 54 Q79 49 84 44" stroke="#8B6232" strokeWidth="1" fill="none" />
          <path d="M50 64 Q66 56 74 51 Q81 46 86 41" stroke="#8B6232" strokeWidth="0.8" fill="none" />
          
          {/* Secondary branch networks */}
          <path d="M32 60 Q28 58 25 56 Q22 54 20 52" stroke="#8B6232" strokeWidth="0.6" fill="none" />
          <path d="M68 60 Q72 58 75 56 Q78 54 80 52" stroke="#8B6232" strokeWidth="0.6" fill="none" />
          <path d="M30 57 Q27 55 24 53 Q21 51 18 49" stroke="#8B6232" strokeWidth="0.5" fill="none" />
          <path d="M70 57 Q73 55 76 53 Q79 51 82 49" stroke="#8B6232" strokeWidth="0.5" fill="none" />
          
          {/* Foliage - Almond-shaped elements at branch ends */}
          {/* Left side foliage */}
          <ellipse cx="18" cy="50" rx="2" ry="6" fill="#8B6232" transform="rotate(-25 18 50)" />
          <ellipse cx="20" cy="48" rx="1.8" ry="5" fill="#8B6232" transform="rotate(-35 20 48)" />
          <ellipse cx="16" cy="48" rx="1.5" ry="4" fill="#8B6232" transform="rotate(-45 16 48)" />
          <ellipse cx="22" cy="46" rx="1.8" ry="5" fill="#8B6232" transform="rotate(-20 22 46)" />
          <ellipse cx="24" cy="44" rx="1.6" ry="4" fill="#8B6232" transform="rotate(-30 24 44)" />
          <ellipse cx="26" cy="42" rx="1.4" ry="3.5" fill="#8B6232" transform="rotate(-40 26 42)" />
          <ellipse cx="28" cy="40" rx="1.2" ry="3" fill="#8B6232" transform="rotate(-50 28 40)" />
          <ellipse cx="30" cy="38" rx="1" ry="2.5" fill="#8B6232" transform="rotate(-60 30 38)" />
          
          {/* Center foliage */}
          <ellipse cx="35" cy="45" rx="1.5" ry="4" fill="#8B6232" transform="rotate(-15 35 45)" />
          <ellipse cx="38" cy="43" rx="1.3" ry="3.5" fill="#8B6232" transform="rotate(-25 38 43)" />
          <ellipse cx="42" cy="41" rx="1.1" ry="3" fill="#8B6232" transform="rotate(-35 42 41)" />
          <ellipse cx="46" cy="39" rx="1" ry="2.5" fill="#8B6232" transform="rotate(-45 46 39)" />
          <ellipse cx="54" cy="39" rx="1" ry="2.5" fill="#8B6232" transform="rotate(45 54 39)" />
          <ellipse cx="58" cy="41" rx="1.1" ry="3" fill="#8B6232" transform="rotate(35 58 41)" />
          <ellipse cx="62" cy="43" rx="1.3" ry="3.5" fill="#8B6232" transform="rotate(25 62 43)" />
          <ellipse cx="65" cy="45" rx="1.5" ry="4" fill="#8B6232" transform="rotate(15 65 45)" />
          
          {/* Right side foliage */}
          <ellipse cx="70" cy="38" rx="1" ry="2.5" fill="#8B6232" transform="rotate(60 70 38)" />
          <ellipse cx="72" cy="40" rx="1.2" ry="3" fill="#8B6232" transform="rotate(50 72 40)" />
          <ellipse cx="74" cy="42" rx="1.4" ry="3.5" fill="#8B6232" transform="rotate(40 74 42)" />
          <ellipse cx="76" cy="44" rx="1.6" ry="4" fill="#8B6232" transform="rotate(30 76 44)" />
          <ellipse cx="78" cy="46" rx="1.8" ry="5" fill="#8B6232" transform="rotate(20 78 46)" />
          <ellipse cx="84" cy="48" rx="1.5" ry="4" fill="#8B6232" transform="rotate(45 84 48)" />
          <ellipse cx="82" cy="48" rx="1.8" ry="5" fill="#8B6232" transform="rotate(35 82 48)" />
          <ellipse cx="80" cy="50" rx="2" ry="6" fill="#8B6232" transform="rotate(25 80 50)" />
          
          {/* Additional dense foliage for fullness */}
          <ellipse cx="32" cy="52" rx="1.2" ry="3" fill="#8B6232" transform="rotate(-20 32 52)" />
          <ellipse cx="68" cy="52" rx="1.2" ry="3" fill="#8B6232" transform="rotate(20 68 52)" />
          <ellipse cx="40" cy="47" rx="1" ry="2.5" fill="#8B6232" transform="rotate(-10 40 47)" />
          <ellipse cx="60" cy="47" rx="1" ry="2.5" fill="#8B6232" transform="rotate(10 60 47)" />
          <ellipse cx="44" cy="45" rx="0.8" ry="2" fill="#8B6232" transform="rotate(-5 44 45)" />
          <ellipse cx="56" cy="45" rx="0.8" ry="2" fill="#8B6232" transform="rotate(5 56 45)" />
        </g>
      </svg>
    </div>
  );
};

export default AcaciaLogo;