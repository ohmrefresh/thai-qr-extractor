import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import jsQR from 'jsqr';
import { parseThaiQR } from '../../utils/thaiQRParser';
import { toast } from 'sonner';

describe('FileUpload Component', () => {
  let onScanSuccess: ReturnType<typeof vi.fn>;
  let onScanError: ReturnType<typeof vi.fn>;
  let mockFileReader: any;
  let mockImage: any;
  let mockGetContext: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    onScanSuccess = vi.fn();
    onScanError = vi.fn();
    vi.clearAllMocks();

    // Setup FileReader mock
    mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null,
      onerror: null,
      result: 'data:image/png;base64,fakedata',
    };
    global.FileReader = vi.fn(function() {
      return mockFileReader;
    }) as any;

    // Setup Image mock
    mockImage = {
      onload: null,
      onerror: null,
      src: '',
      width: 100,
      height: 100,
    };
    global.Image = vi.fn(function() {
      return mockImage;
    }) as any;

    // Setup canvas mock
    mockGetContext = vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      })),
    }));

    originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: mockGetContext,
          width: 0,
          height: 0,
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.createElement = originalCreateElement;
  });

  // Helper to simulate successful image processing
  const simulateImageLoad = () => {
    mockFileReader.onload?.({ target: { result: mockFileReader.result } } as any);
    mockImage.onload?.();
  };

  describe('Rendering', () => {
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

    test('renders file type hint', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);
      expect(screen.getByText(/Supports PNG, JPG, WebP up to 10MB/i)).toBeInTheDocument();
    });

    test('renders hidden file input', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('File Selection', () => {
    test('triggers file input when button is clicked', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const uploadButton = screen.getByText(/Click or drop image here/i);
      fireEvent.click(uploadButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    test('does not trigger file input when processing', async () => {
      vi.mocked(jsQR).mockReturnValue(null);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      // Start processing by selecting a file
      const imageFile = new File(['fake-image'], 'qr.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [imageFile] } });

      // Verify we're in processing state
      await waitFor(() => {
        expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
      });

      // Clear the mock to check if new clicks trigger file input
      clickSpy.mockClear();

      // Try to click while processing
      const uploadButton = screen.getByText(/Processing.../i).closest('button');
      fireEvent.click(uploadButton!);

      // Click should not trigger file input during processing
      expect(clickSpy).not.toHaveBeenCalled();
    });

    test('prevents triggering file input when already processing via dropzone click', async () => {
      vi.mocked(jsQR).mockReturnValue(null);

      // Create a ref to access the internal processing state
      const { rerender } = render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      // Start processing by selecting a file
      const imageFile = new File(['fake-image'], 'qr.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [imageFile] } });

      // Wait for processing state
      await waitFor(() => {
        expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
      });

      // Clear spy after initial processing starts
      clickSpy.mockClear();

      // Try clicking the dropzone multiple times while processing
      const dropzone = screen.getByText(/Processing.../i).closest('button');
      fireEvent.click(dropzone!);
      fireEvent.click(dropzone!);
      fireEvent.click(dropzone!);

      // File input click should not have been triggered
      expect(clickSpy).not.toHaveBeenCalled();
    });

    test('resets input value after file selection to allow re-uploading same file', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [imageFile] } });

      expect(fileInput.value).toBe('');
    });
  });

  describe('File Type Validation', () => {
    test('calls onScanError when non-image file is selected', async () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('Please select an image file');
      });
    });

    test('accepts various image formats', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Test PNG
      const pngFile = new File(['fake'], 'test.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [pngFile] } });
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(pngFile);

      // Reset mock
      vi.clearAllMocks();

      // Test JPEG
      const jpegFile = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [jpegFile] } });
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(jpegFile);

      // Reset mock
      vi.clearAllMocks();

      // Test WebP
      const webpFile = new File(['fake'], 'test.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [webpFile] } });
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(webpFile);
    });

    test('does nothing when no file is selected', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockFileReader.readAsDataURL).not.toHaveBeenCalled();
      expect(onScanSuccess).not.toHaveBeenCalled();
      expect(onScanError).not.toHaveBeenCalled();
    });
  });

  describe('Image Processing - Success Cases', () => {
    test('successfully processes image with valid QR code', async () => {
      const mockParsedData = {
        rawData: '00020101021129370016A000000677010111011300668123456785802TH',
        parsedFields: [],
      };

      vi.mocked(jsQR).mockReturnValue({
        data: '00020101021129370016A000000677010111011300668123456785802TH',
      } as any);
      vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });
      simulateImageLoad();

      await waitFor(() => {
        expect(onScanSuccess).toHaveBeenCalledWith(mockParsedData);
      });

      expect(toast.success).toHaveBeenCalledWith('QR code decoded successfully');
    });

    test('shows processing state during image decoding', async () => {
      vi.mocked(jsQR).mockReturnValue(null);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show processing state immediately
      expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
      expect(screen.getByText(/Decoding QR code/i)).toBeInTheDocument();

      // Complete the processing
      simulateImageLoad();

      await waitFor(() => {
        expect(screen.getByText(/Click or drop image here/i)).toBeInTheDocument();
      });
    });

    test('disables input and button during processing', async () => {
      vi.mocked(jsQR).mockReturnValue(null);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(fileInput).toBeDisabled();

      const dropzone = screen.getByText(/Processing.../i).closest('button');
      expect(dropzone).toBeDisabled();

      // Complete processing
      simulateImageLoad();

      await waitFor(() => {
        expect(fileInput).not.toBeDisabled();
      });
    });
  });

  describe('Image Processing - Error Cases', () => {
    test('handles image with no QR code found', async () => {
      vi.mocked(jsQR).mockReturnValue(null);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });
      simulateImageLoad();

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('No QR code found in the image');
      });

      expect(toast.error).toHaveBeenCalledWith('No QR code found in image');
    });

    test('handles canvas context creation failure', async () => {
      mockGetContext.mockReturnValue(null);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });
      simulateImageLoad();

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('Failed to create canvas context');
      });
    });

    test('handles image load error', async () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Trigger FileReader onload
      mockFileReader.onload?.({ target: { result: mockFileReader.result } } as any);

      // Trigger Image onerror instead of onload
      mockImage.onerror?.();

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('Failed to load image');
      });
    });

    test('handles FileReader error', async () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Trigger FileReader onerror
      mockFileReader.onerror?.();

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('Failed to read file');
      });
    });

    test('handles QR parsing error', async () => {
      vi.mocked(jsQR).mockReturnValue({
        data: 'invalid-qr-data',
      } as any);
      vi.mocked(parseThaiQR).mockImplementation(() => {
        throw new Error('Invalid QR format');
      });

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });
      simulateImageLoad();

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('Failed to parse QR code: Error: Invalid QR format');
      });
    });
  });

  describe('Drag and Drop', () => {
    test('applies drag-active class on drag enter', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const dropzone = screen.getByText(/Click or drop image here/i).closest('button');

      fireEvent.dragEnter(dropzone!);

      expect(dropzone).toHaveClass('drag-active');
    });

    test('removes drag-active class on drag leave', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const dropzone = screen.getByText(/Click or drop image here/i).closest('button');

      fireEvent.dragEnter(dropzone!);
      expect(dropzone).toHaveClass('drag-active');

      fireEvent.dragLeave(dropzone!);
      expect(dropzone).not.toHaveClass('drag-active');
    });

    test('prevents default behavior on drag over', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const dropzone = screen.getByText(/Click or drop image here/i).closest('button');

      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');

      fireEvent(dropzone!, dragOverEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('processes dropped image file', async () => {
      const mockParsedData = {
        rawData: '000201010211',
        parsedFields: [],
      };

      vi.mocked(jsQR).mockReturnValue({
        data: '000201010211',
      } as any);
      vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const dropzone = screen.getByText(/Click or drop image here/i).closest('button');
      const file = new File(['fake-image'], 'qr.png', { type: 'image/png' });

      // Use fireEvent.drop with dataTransfer
      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [file],
        },
      });

      simulateImageLoad();

      await waitFor(() => {
        expect(onScanSuccess).toHaveBeenCalledWith(mockParsedData);
      });
    });

    test('handles drop without files gracefully', () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const dropzone = screen.getByText(/Click or drop image here/i).closest('button');

      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [],
        },
      });

      expect(mockFileReader.readAsDataURL).not.toHaveBeenCalled();
      expect(onScanSuccess).not.toHaveBeenCalled();
    });

    test('rejects non-image files on drop', async () => {
      render(<FileUpload onScanSuccess={onScanSuccess} onScanError={onScanError} />);

      const dropzone = screen.getByText(/Click or drop image here/i).closest('button');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(onScanError).toHaveBeenCalledWith('Please select an image file');
      });
    });
  });
});


