import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ChevronIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => {
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
      style={style}
    >
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  );
};

export default ChevronIcon;
