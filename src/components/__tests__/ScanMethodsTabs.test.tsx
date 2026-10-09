import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ScanMethodsTabs from '../ScanMethodsTabs';

const props = {
  onCameraScan: vi.fn(),
  onFileScan: vi.fn(),
  onTextScan: vi.fn(),
  onError: vi.fn()
};

const mockPointer = (coarse: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarse : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })) as any;
};

describe('ScanMethodsTabs', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.removeItem('scanMethod');
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('opens on Paste for mouse and trackpad users', async () => {
    mockPointer(false);
    render(<ScanMethodsTabs {...props} />);

    expect(await screen.findByText('Paste QR Payload')).toBeInTheDocument();
  });

  test('opens on Camera for touch users', async () => {
    mockPointer(true);
    render(<ScanMethodsTabs {...props} />);

    expect(await screen.findByText('Camera Scanner')).toBeInTheDocument();
  });

  test('remembers the last method chosen', async () => {
    mockPointer(false);
    const { unmount } = render(<ScanMethodsTabs {...props} />);
    fireEvent.click(screen.getByText('Upload'));
    expect(await screen.findByText('Upload Image')).toBeInTheDocument();
    unmount();

    render(<ScanMethodsTabs {...props} />);
    expect(await screen.findByText('Upload Image')).toBeInTheDocument();
  });
});
