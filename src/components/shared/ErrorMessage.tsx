import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`error-message-modern ${className}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{message}</span>
    </div>
  );
};

interface ErrorMessagesProps {
  errors: string[];
  className?: string;
}

export const ErrorMessages: React.FC<ErrorMessagesProps> = ({
  errors,
  className = ''
}) => {
  if (errors.length === 0) return null;

  return (
    <div className={`error-messages-modern ${className}`}>
      {errors.map((error, index) => (
        <ErrorMessage key={index} message={error} />
      ))}
    </div>
  );
};

export default ErrorMessage;
