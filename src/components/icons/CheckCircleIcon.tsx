import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

const CheckCircleIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '' }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="8 12.5 11 15.5 16 9.5"></polyline>
    </svg>
  );
};

export default CheckCircleIcon;
