import React from 'react';
import Image from 'next/image';

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

  return (
    <div className={className} style={{ width: logoSize, height: logoSize }}>
      <Image src="/logo.png?v=2" alt="AI Capital" width={logoSize} height={logoSize} className="object-contain w-full h-full" />
    </div>
  );
};

export default AcaciaLogo;