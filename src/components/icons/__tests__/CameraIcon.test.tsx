import React from 'react';
import { render } from '@testing-library/react';
import CameraIcon from '../CameraIcon';

describe('CameraIcon Component', () => {
  test('renders with default props', () => {
    const { container } = render(<CameraIcon />);
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
    const { container } = render(<CameraIcon width={32} height={32} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  test('renders with custom className', () => {
    const { container } = render(<CameraIcon className="camera-icon" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('camera-icon');
  });

  test('renders with all custom props', () => {
    const { container } = render(
      <CameraIcon width={48} height={48} className="camera-icon-large" />
    );
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
    expect(svg).toHaveClass('camera-icon-large');
  });

  test('contains correct SVG elements', () => {
    const { container } = render(<CameraIcon />);
    
    // Check for path element (camera body)
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z');
    
    // Check for circle element (camera lens)
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '13');
    expect(circle).toHaveAttribute('r', '4');
  });

  test('renders with zero size', () => {
    const { container } = render(<CameraIcon width={0} height={0} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  test('renders with empty className', () => {
    const { container } = render(<CameraIcon className="" />);
    const svg = container.querySelector('svg');
    
    expect(svg).not.toHaveClass('undefined');
  });
});
