'use client';

interface AcaciaLogoProps {
  className?: string;
  size?: number;
}

export default function AcaciaLogo({ className = '', size = 48 }: AcaciaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#654321" />
        </linearGradient>
        <linearGradient id="canopyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow Effect */}
      <circle cx="100" cy="80" r="80" fill="url(#glowGradient)" />

      {/* Tree Trunk */}
      <path
        d="M 90 140 L 85 200 L 115 200 L 110 140 Z"
        fill="url(#trunkGradient)"
        stroke="#654321"
        strokeWidth="1"
      />

      {/* Main Canopy - Flat-topped Acacia style */}
      <ellipse
        cx="100"
        cy="70"
        rx="80"
        ry="35"
        fill="url(#canopyGradient)"
        opacity="0.9"
      />

      {/* Secondary Canopy Layer for depth */}
      <ellipse
        cx="100"
        cy="75"
        rx="75"
        ry="30"
        fill="#059669"
        opacity="0.8"
      />

      {/* Tertiary Canopy Layer */}
      <ellipse
        cx="100"
        cy="80"
        rx="70"
        ry="25"
        fill="#047857"
        opacity="0.7"
      />

      {/* Canopy Details - Branches */}
      <path
        d="M 40 70 Q 60 60, 80 65"
        stroke="#047857"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 160 70 Q 140 60, 120 65"
        stroke="#047857"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 70 75 Q 85 68, 100 70"
        stroke="#047857"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 130 75 Q 115 68, 100 70"
        stroke="#047857"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />

      {/* Highlight on canopy */}
      <ellipse
        cx="100"
        cy="65"
        rx="60"
        ry="15"
        fill="#34D399"
        opacity="0.3"
      />

      {/* Trunk Texture */}
      <line x1="95" y1="150" x2="93" y2="190" stroke="#654321" strokeWidth="1" opacity="0.5" />
      <line x1="105" y1="150" x2="107" y2="190" stroke="#654321" strokeWidth="1" opacity="0.5" />
      <line x1="100" y1="160" x2="98" y2="185" stroke="#654321" strokeWidth="1" opacity="0.5" />

      {/* Ground Shadow */}
      <ellipse
        cx="100"
        cy="200"
        rx="30"
        ry="5"
        fill="#000000"
        opacity="0.2"
      />
    </svg>
  );
}
