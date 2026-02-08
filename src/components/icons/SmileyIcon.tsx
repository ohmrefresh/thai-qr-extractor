import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SmileyIcon: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
  );
};

export default SmileyIcon;
