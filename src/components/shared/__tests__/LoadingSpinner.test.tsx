import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders loading spinner', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('applies default medium size class', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('spinner');
    expect(spinner).not.toHaveClass('spinner-small');
    expect(spinner).not.toHaveClass('loading-spinner');
  });

  test('applies small size class when size is small', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('spinner');
    expect(spinner).toHaveClass('spinner-small');
  });

  test('applies large size class when size is large', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('spinner');
    expect(spinner).toHaveClass('loading-spinner');
  });

  test('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('custom-class');
  });

  test('applies both size class and custom className', () => {
    const { container } = render(<LoadingSpinner size="small" className="my-spinner" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('spinner');
    expect(spinner).toHaveClass('spinner-small');
    expect(spinner).toHaveClass('my-spinner');
  });

  test('renders with all props combined', () => {
    const { container } = render(<LoadingSpinner size="large" className="extra-class" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('spinner');
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toHaveClass('extra-class');
  });
});
