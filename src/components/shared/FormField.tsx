import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  hint,
  error,
  children,
  htmlFor
}) => {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>
        <span className="field-label">{label}</span>
        {required && <span className="field-required">*</span>}
      </label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="error-message" style={{ marginTop: '0.5rem' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;
