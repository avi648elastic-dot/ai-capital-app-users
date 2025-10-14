import React from 'react';
import TechLogo from './TechLogo';

interface AcaciaLogoProps {
  className?: string;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
}

const AcaciaLogo: React.FC<AcaciaLogoProps> = ({ className = '', size = 'md' }) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    const sizeMap = { sm: 24, md: 32, lg: 48, xl: 64 } as const;
    return sizeMap[size];
  };

  const logoSize = getSize();

  return <TechLogo className={className} size={logoSize} />;
};

export default AcaciaLogo;