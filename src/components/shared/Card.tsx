import React from 'react';

interface CardProps {
  icon?: React.ReactNode;
  iconAccent?: 'camera' | 'upload' | 'text' | 'result' | 'generate' | 'history' | 'scan';
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  icon,
  iconAccent,
  title,
  subtitle,
  children,
  className = ''
}) => {
  return (
    <div className={`card ${className}`}>
      {icon && (
        <div className={`card-icon ${iconAccent ? `accent-${iconAccent}` : ''}`}>
          {icon}
        </div>
      )}
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
};

export default Card;
