import React from 'react';
import { render } from '@testing-library/react';
import UploadIcon from '../UploadIcon';

describe('UploadIcon Component', () => {
  test('renders with default props', () => {
    const { container } = render(<UploadIcon />);
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
    const { container } = render(<UploadIcon width={32} height={32} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  test('renders with custom className', () => {
    const { container } = render(<UploadIcon className="custom-icon" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('custom-icon');
  });

  test('renders with all custom props', () => {
    const { container } = render(
      <UploadIcon width={48} height={48} className="upload-icon-large" />
    );
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
    expect(svg).toHaveClass('upload-icon-large');
  });

  test('contains correct SVG paths', () => {
    const { container } = render(<UploadIcon />);
    
    // Check for path element
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    
    // Check for polyline element
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    expect(polyline).toHaveAttribute('points', '17,8 12,3 7,8');
    
    // Check for line element
    const line = container.querySelector('line');
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute('x1', '12');
    expect(line).toHaveAttribute('y1', '3');
    expect(line).toHaveAttribute('x2', '12');
    expect(line).toHaveAttribute('y2', '15');
  });

  test('renders with zero size', () => {
    const { container } = render(<UploadIcon width={0} height={0} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  test('renders with empty className', () => {
    const { container } = render(<UploadIcon className="" />);
    const svg = container.querySelector('svg');
    
    // Should not have any class when empty string is passed
    expect(svg).not.toHaveClass('undefined');
  });
});
