import React from 'react';

interface AcaciaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AcaciaLogo: React.FC<AcaciaLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Acacia Tree Logo */}
        <g>
          {/* Trunk */}
          <rect x="45" y="60" width="10" height="25" fill="#8B4513" rx="2" />
          
          {/* Main Branches */}
          <path d="M35 55 Q45 50 55 55" stroke="#8B4513" strokeWidth="2" fill="none" />
          <path d="M35 50 Q45 45 55 50" stroke="#8B4513" strokeWidth="2" fill="none" />
          <path d="M35 45 Q45 40 55 45" stroke="#8B4513" strokeWidth="2" fill="none" />
          
          {/* Left Branch System */}
          <path d="M35 55 Q25 52 20 48" stroke="#8B4513" strokeWidth="1.5" fill="none" />
          <path d="M35 50 Q25 47 20 43" stroke="#8B4513" strokeWidth="1.5" fill="none" />
          <path d="M35 45 Q25 42 20 38" stroke="#8B4513" strokeWidth="1.5" fill="none" />
          
          {/* Right Branch System */}
          <path d="M55 55 Q65 52 70 48" stroke="#8B4513" strokeWidth="1.5" fill="none" />
          <path d="M55 50 Q65 47 70 43" stroke="#8B4513" strokeWidth="1.5" fill="none" />
          <path d="M55 45 Q65 42 70 38" stroke="#8B4513" strokeWidth="1.5" fill="none" />
          
          {/* Foliage - Teardrop shaped leaves */}
          {/* Left side foliage */}
          <ellipse cx="25" cy="50" rx="4" ry="8" fill="#228B22" transform="rotate(-30 25 50)" />
          <ellipse cx="22" cy="45" rx="3.5" ry="7" fill="#32CD32" transform="rotate(-45 22 45)" />
          <ellipse cx="28" cy="43" rx="4" ry="6" fill="#228B22" transform="rotate(-15 28 43)" />
          <ellipse cx="20" cy="40" rx="3" ry="6" fill="#32CD32" transform="rotate(-60 20 40)" />
          <ellipse cx="30" cy="38" rx="3.5" ry="5" fill="#228B22" transform="rotate(-10 30 38)" />
          
          {/* Center foliage */}
          <ellipse cx="40" cy="48" rx="3.5" ry="7" fill="#32CD32" transform="rotate(-20 40 48)" />
          <ellipse cx="45" cy="45" rx="4" ry="6" fill="#228B22" transform="rotate(-10 45 45)" />
          <ellipse cx="50" cy="48" rx="3.5" ry="7" fill="#32CD32" transform="rotate(20 50 48)" />
          <ellipse cx="55" cy="45" rx="4" ry="6" fill="#228B22" transform="rotate(10 55 45)" />
          
          {/* Right side foliage */}
          <ellipse cx="75" cy="50" rx="4" ry="8" fill="#228B22" transform="rotate(30 75 50)" />
          <ellipse cx="78" cy="45" rx="3.5" ry="7" fill="#32CD32" transform="rotate(45 78 45)" />
          <ellipse cx="72" cy="43" rx="4" ry="6" fill="#228B22" transform="rotate(15 72 43)" />
          <ellipse cx="80" cy="40" rx="3" ry="6" fill="#32CD32" transform="rotate(60 80 40)" />
          <ellipse cx="70" cy="38" rx="3.5" ry="5" fill="#228B22" transform="rotate(10 70 38)" />
          
          {/* Additional canopy layers for fullness */}
          <ellipse cx="35" cy="42" rx="3" ry="5" fill="#32CD32" transform="rotate(-25 35 42)" />
          <ellipse cx="65" cy="42" rx="3" ry="5" fill="#32CD32" transform="rotate(25 65 42)" />
          <ellipse cx="50" cy="40" rx="2.5" ry="4" fill="#228B22" transform="rotate(0 50 40)" />
        </g>
      </svg>
    </div>
  );
};

export default AcaciaLogo;