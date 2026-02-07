import React from 'react';
import { render, screen } from '@testing-library/react';
import FormField from '../FormField';

describe('FormField Component', () => {
  test('renders with label and children', () => {
    render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('renders with required indicator', () => {
    render(
      <FormField label="Test Label" required>
        <input type="text" />
      </FormField>
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('does not render required indicator when not required', () => {
    const { container } = render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    );
    
    const requiredSpan = container.querySelector('.field-required');
    expect(requiredSpan).not.toBeInTheDocument();
  });

  test('renders with hint text', () => {
    render(
      <FormField label="Test Label" hint="This is a hint">
        <input type="text" />
      </FormField>
    );
    
    expect(screen.getByText('This is a hint')).toBeInTheDocument();
  });

  test('renders with error message', () => {
    render(
      <FormField label="Test Label" error="This is an error">
        <input type="text" />
      </FormField>
    );
    
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  test('renders with both hint and error', () => {
    render(
      <FormField label="Test Label" hint="This is a hint" error="This is an error">
        <input type="text" />
      </FormField>
    );
    
    expect(screen.getByText('This is a hint')).toBeInTheDocument();
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  test('renders with htmlFor attribute', () => {
    const { container } = render(
      <FormField label="Test Label" htmlFor="test-input">
        <input id="test-input" type="text" />
      </FormField>
    );
    
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  test('renders with complex children', () => {
    render(
      <FormField label="Select Option" htmlFor="test-select">
        <select id="test-select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
      </FormField>
    );
    
    expect(screen.getByLabelText('Select Option')).toBeInTheDocument();
  });

  test('applies form-field class to root element', () => {
    const { container } = render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    );
    
    const formField = container.firstChild;
    expect(formField).toHaveClass('form-field');
  });

  test('applies field-label class to label span', () => {
    const { container } = render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    );
    
    const labelSpan = container.querySelector('.field-label');
    expect(labelSpan).toBeInTheDocument();
    expect(labelSpan).toHaveTextContent('Test Label');
  });

  test('applies field-hint class to hint span', () => {
    const { container } = render(
      <FormField label="Test Label" hint="This is a hint">
        <input type="text" />
      </FormField>
    );
    
    const hintSpan = container.querySelector('.field-hint');
    expect(hintSpan).toBeInTheDocument();
    expect(hintSpan).toHaveTextContent('This is a hint');
  });

  test('applies error-message class to error span', () => {
    const { container } = render(
      <FormField label="Test Label" error="This is an error">
        <input type="text" />
      </FormField>
    );
    
    const errorSpan = container.querySelector('.error-message');
    expect(errorSpan).toBeInTheDocument();
    expect(errorSpan).toHaveTextContent('This is an error');
    expect(errorSpan).toHaveStyle({ marginTop: '0.5rem' });
  });

  test('does not render hint when not provided', () => {
    const { container } = render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    );
    
    const hintSpan = container.querySelector('.field-hint');
    expect(hintSpan).not.toBeInTheDocument();
  });

  test('does not render error when not provided', () => {
    const { container } = render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    );
    
    const errorSpan = container.querySelector('.error-message');
    expect(errorSpan).not.toBeInTheDocument();
  });
});
