import React from 'react';
import { render } from '@testing-library/react';
import AlertIcon from '../AlertIcon';

describe('AlertIcon Component', () => {
  test('renders with default props', () => {
    const { container } = render(<AlertIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  test('renders with custom width and height', () => {
    const { container } = render(<AlertIcon width={32} height={32} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  test('renders with custom className', () => {
    const { container } = render(<AlertIcon className="alert-icon" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('alert-icon');
  });

  test('renders with all custom props', () => {
    const { container } = render(
      <AlertIcon width={48} height={48} className="alert-icon-large" />
    );
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
    expect(svg).toHaveClass('alert-icon-large');
  });

  test('contains correct SVG elements', () => {
    const { container } = render(<AlertIcon />);
    
    // Check for circle element (outer ring)
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '12');
    expect(circle).toHaveAttribute('r', '10');
    
    // Check for line elements (exclamation mark)
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);
    
    // First line (upper part of exclamation)
    expect(lines[0]).toHaveAttribute('x1', '12');
    expect(lines[0]).toHaveAttribute('y1', '8');
    expect(lines[0]).toHaveAttribute('x2', '12');
    expect(lines[0]).toHaveAttribute('y2', '12');
    
    // Second line (dot of exclamation)
    expect(lines[1]).toHaveAttribute('x1', '12');
    expect(lines[1]).toHaveAttribute('y1', '16');
    expect(lines[1]).toHaveAttribute('x2', '12.01');
    expect(lines[1]).toHaveAttribute('y2', '16');
  });

  test('renders with zero size', () => {
    const { container } = render(<AlertIcon width={0} height={0} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  test('renders with empty className', () => {
    const { container } = render(<AlertIcon className="" />);
    const svg = container.querySelector('svg');
    
    expect(svg).not.toHaveClass('undefined');
  });
});
