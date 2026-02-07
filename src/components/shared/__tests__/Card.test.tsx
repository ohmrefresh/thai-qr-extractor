import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  test('renders with title only', () => {
    render(<Card title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with title and subtitle', () => {
    render(<Card title="Test Title" subtitle="Test Subtitle" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  test('renders with icon', () => {
    const mockIcon = <span data-testid="mock-icon">Icon</span>;
    render(<Card title="Test Title" icon={mockIcon} />);
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('renders with icon and accent', () => {
    const { container } = render(
      <Card title="Test Title" icon={<span>Icon</span>} iconAccent="camera" />
    );
    
    const iconWrapper = container.querySelector('.card-icon');
    expect(iconWrapper).toHaveClass('accent-camera');
  });

  test('renders with all accent types', () => {
    const accents: Array<'camera' | 'upload' | 'text' | 'result' | 'generate' | 'history' | 'scan'> = [
      'camera', 'upload', 'text', 'result', 'generate', 'history', 'scan'
    ];
    
    accents.forEach(accent => {
      const { container, rerender } = render(
        <Card title="Test" icon={<span>Icon</span>} iconAccent={accent} />
      );
      
      const iconWrapper = container.querySelector('.card-icon');
      expect(iconWrapper).toHaveClass(`accent-${accent}`);
      
      rerender(<></>);
    });
  });

  test('renders with custom className', () => {
    const { container } = render(<Card title="Test" className="custom-card" />);
    
    const card = container.querySelector('.card');
    expect(card).toHaveClass('custom-card');
  });

  test('renders with children', () => {
    render(
      <Card title="Test Title">
        <div data-testid="card-content">Child Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  test('does not render icon section when icon is not provided', () => {
    const { container } = render(<Card title="Test Title" />);
    
    const iconWrapper = container.querySelector('.card-icon');
    expect(iconWrapper).not.toBeInTheDocument();
  });

  test('does not render subtitle when not provided', () => {
    const { container } = render(<Card title="Test Title" />);
    
    const subtitle = container.querySelector('.card-subtitle');
    expect(subtitle).not.toBeInTheDocument();
  });

  test('does not apply accent class when iconAccent is not provided', () => {
    const { container } = render(<Card title="Test" icon={<span>Icon</span>} />);
    
    const iconWrapper = container.querySelector('.card-icon');
    expect(iconWrapper).not.toHaveClass('accent-camera');
  });

  test('renders with complex children', () => {
    render(
      <Card title="Test Title" subtitle="Test Subtitle">
        <button>Click Me</button>
        <p>Description text</p>
      </Card>
    );
    
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  test('applies card class to root element', () => {
    const { container } = render(<Card title="Test" />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('card');
  });
});
