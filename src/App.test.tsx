import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Thai QR Code Tools', () => {
  render(<App />);
  const headingElement = screen.getByText(/Thai QR Code Tools/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders QR scanner component', () => {
  render(<App />);
  const scanButton = screen.getByRole('button', { name: /Start Camera Scanner/i });
  expect(scanButton).toBeInTheDocument();
});

test('renders file upload component', () => {
  render(<App />);
  const uploadButton = screen.getByText(/Choose File/i);
  expect(uploadButton).toBeInTheDocument();
});
