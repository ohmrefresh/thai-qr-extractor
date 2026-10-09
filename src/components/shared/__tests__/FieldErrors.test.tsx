import React from 'react';
import { render, screen } from '@testing-library/react';
import { FieldErrorsProvider, FieldError, useFieldA11y, fieldHintId } from '../FieldErrors';

const Input: React.FC<{ field: string }> = ({ field }) => {
  const a11y = useFieldA11y(field, { hasHint: true });
  return (
    <>
      <label htmlFor={field}>{field}</label>
      <input id={field} {...a11y} />
      <span id={fieldHintId(field)}>hint</span>
      <FieldError field={field} />
    </>
  );
};

describe('FieldErrors', () => {
  test('marks the matching input invalid and links its error and hint', () => {
    render(
      <FieldErrorsProvider errors={[{ field: 'billerId', message: 'Biller ID is required for bill payment' }]}>
        <Input field="billerId" />
        <Input field="reference1" />
      </FieldErrorsProvider>
    );

    const biller = screen.getByLabelText('billerId');
    expect(biller).toHaveAttribute('aria-invalid', 'true');
    expect(biller).toHaveAccessibleDescription('Biller ID is required for bill payment hint');

    const reference = screen.getByLabelText('reference1');
    expect(reference).not.toHaveAttribute('aria-invalid');
    expect(reference).toHaveAccessibleDescription('hint');
  });
});
