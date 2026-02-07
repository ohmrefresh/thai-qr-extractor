import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FileUpload from '../FileUpload';

// Mock jsQR
vi.mock('jsqr', () => ({
  default: vi.fn(),
}));

// Mock thaiQRParser
vi.mock('../../utils/thaiQRParser', () => ({
  parseThaiQR: vi.fn(),
}));

import jsQR from 'jsqr';
import { parseThaiQR } from '../../utils/thaiQRParser';

describe('FileUpload Component', () => {
  let onScanSuccess: ReturnType<typeof vi.fn>;
  let onScanError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onScanSuccess = vi.fn();
    onScanError = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders upload button', () => {
    render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const uploadButton = screen.getByText(/Click or drop image here/i);
    expect(uploadButton).toBeInTheDocument();
  });

  test('renders card title and subtitle', () => {
    render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Select or drag a QR code image for instant decoding/i)).toBeInTheDocument();
  });

  test('triggers file input when button is clicked', () => {
    render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const uploadButton = screen.getByText(/Click or drop image here/i);
    fireEvent.click(uploadButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  test('calls onScanError when non-image file is selected', async () => {
    render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onScanError).toHaveBeenCalledWith('Please select an image file');
    });
  });

  test('successfully processes image with valid QR code', async () => {
    const mockParsedData = {
      rawData: '00020101',
      parsedFields: [],
    };

    vi.mocked(jsQR).mockReturnValue({
      data: '00020101021129370016A000000677010111011300668123456785802TH',
    });
    vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

    render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/png;base64,fakedata',
    };

    global.FileReader = function() {
      return mockFileReader;
    } as any;

    // Mock Image
    const mockImage = {
      onload: null as any,
      src: '',
      width: 100,
      height: 100,
    };
    global.Image = function() {
      return mockImage;
    } as any;

    // Mock canvas
    const mockGetContext = vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      })),
    }));

    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: mockGetContext,
          width: 0,
          height: 0,
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger FileReader onload
    mockFileReader.onload!({ target: { result: mockFileReader.result } } as any);

    // Trigger Image onload
    mockImage.onload!();

    await waitFor(() => {
      expect(onScanSuccess).toHaveBeenCalledWith(mockParsedData);
    });
  });

});
