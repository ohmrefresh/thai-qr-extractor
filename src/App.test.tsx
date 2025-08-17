import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Thai QR Code Extractor', () => {
  render(<App />);
  const headingElement = screen.getByText(/Thai QR Code Extractor/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders QR scanner component', () => {
  render(<App />);
  const scanButton = screen.getByRole('button', { name: /Start QR Scanner/i });
  expect(scanButton).toBeInTheDocument();
});

test('renders file upload component', () => {
  render(<App />);
  const uploadButton = screen.getByText(/Upload QR Code Image/i);
  expect(uploadButton).toBeInTheDocument();
});
