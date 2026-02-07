import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

const ScanIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"></path>
      <path d="M3 7l9-4 9 4"></path>
    </svg>
  );
};

export default ScanIcon;
