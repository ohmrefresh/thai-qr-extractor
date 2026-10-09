import React, { createContext, useContext } from 'react';

export interface FieldErrorEntry {
  /** Form control id the message is about */
  field?: string;
  message: string;
}

const FieldErrorsContext = createContext<Record<string, string>>({});

export const fieldHintId = (field: string) => `${field}-hint`;
export const fieldErrorId = (field: string) => `${field}-error`;

const indexByField = (errors: FieldErrorEntry[]) => {
  const byField: Record<string, string> = {};
  errors.forEach(({ field, message }) => {
    if (field && !byField[field]) byField[field] = message;
  });
  return byField;
};

/** Makes validation errors available to the inputs they belong to */
export const FieldErrorsProvider: React.FC<{ errors: FieldErrorEntry[]; children: React.ReactNode }> = ({
  errors,
  children
}) => {
  return <FieldErrorsContext.Provider value={indexByField(errors)}>{children}</FieldErrorsContext.Provider>;
};

/** aria-invalid / aria-describedby for a control, pointing at its error and hint */
export const fieldA11yProps = (errors: FieldErrorEntry[], field: string, { hasHint = false } = {}) =>
  a11yFor(indexByField(errors)[field], field, hasHint);

export const useFieldA11y = (field: string, { hasHint = false } = {}) =>
  a11yFor(useContext(FieldErrorsContext)[field], field, hasHint);

const a11yFor = (error: string | undefined, field: string, hasHint: boolean) => {
  const describedBy = [error && fieldErrorId(field), hasHint && fieldHintId(field)].filter(Boolean).join(' ');
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined
  } as const;
};

/** The field's error message, shown next to the field it describes */
export const FieldError: React.FC<{ field: string }> = ({ field }) => {
  const error = useContext(FieldErrorsContext)[field];
  if (!error) return null;
  return (
    <span id={fieldErrorId(field)} className="field-error">
      {error}
    </span>
  );
};
