import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = ''
}) => {
  const sizeClass = size === 'small' ? 'spinner-small' : size === 'large' ? 'loading-spinner' : '';

  return (
    <div className={`spinner ${sizeClass} ${className}`}></div>
  );
};

export default LoadingSpinner;
