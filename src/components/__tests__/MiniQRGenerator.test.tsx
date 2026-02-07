import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import MiniQRGenerator from '../MiniQRGenerator';
import * as miniQRGenerator from '../../utils/miniQRGenerator';

// Mock the miniQRGenerator module
vi.mock('../../utils/miniQRGenerator', () => ({
  generateMiniQR: vi.fn(),
  validateMiniQRInput: vi.fn(),
  MiniQRInput: {},
  MiniQRResult: {}
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('MiniQRGenerator Component', () => {
  const mockOnQRGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(miniQRGenerator.validateMiniQRInput).mockReturnValue([]);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Rendering', () => {
    test('renders MiniQRGenerator component', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      expect(screen.getByText(/Required Information/i)).toBeInTheDocument();
      expect(screen.getByText(/QR Code Preview/i)).toBeInTheDocument();
    });

    test('renders all input fields', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      expect(screen.getByLabelText(/Bank Code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Transaction ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Country Code/i)).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      expect(screen.getByRole('button', { name: /Generate Mini QR/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Load Sample/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear Form/i })).toBeInTheDocument();
    });

    test('displays field hints', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      expect(screen.getByText(/3-digit bank code/i)).toBeInTheDocument();
      expect(screen.getByText(/Unique transaction identifier/i)).toBeInTheDocument();
      expect(screen.getByText(/Country code \(default: TH\)/i)).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    test('updates form data when inputs change', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i) as HTMLInputElement;
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i) as HTMLInputElement;
      const countryCodeInput = screen.getByLabelText(/Country Code/i) as HTMLInputElement;

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });
      fireEvent.change(countryCodeInput, { target: { value: 'TH' } });

      expect(bankCodeInput).toHaveValue('014');
      expect(transactionIdInput).toHaveValue('202602078Buvov9xGKBPqxhso');
      expect(countryCodeInput).toHaveValue('TH');
    });

    test('respects maxLength constraints on bank code', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i) as HTMLInputElement;

      expect(bankCodeInput).toHaveAttribute('maxLength', '3');
    });

    test('respects maxLength constraints on transaction ID', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const transactionIdInput = screen.getByLabelText(/Transaction ID/i) as HTMLInputElement;

      expect(transactionIdInput).toHaveAttribute('maxLength', '50');
    });

    test('respects maxLength constraints on country code', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const countryCodeInput = screen.getByLabelText(/Country Code/i) as HTMLInputElement;

      expect(countryCodeInput).toHaveAttribute('maxLength', '2');
    });

    test('has placeholder text for inputs', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      expect(screen.getByPlaceholderText(/e\.g\., 014/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., 202602078Buvov9xGKBPqxhso/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/TH/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    test('shows validation errors when generate is clicked with invalid data', async () => {
      vi.mocked(miniQRGenerator.validateMiniQRInput).mockReturnValue([
        'Bank Code is required',
        'Transaction ID is required'
      ]);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Bank Code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Transaction ID is required/i)).toBeInTheDocument();
      });
    });

    test('clears validation errors when user types', async () => {
      vi.mocked(miniQRGenerator.validateMiniQRInput).mockReturnValue(['Bank Code is required']);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Bank Code is required/i)).toBeInTheDocument();
      });

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      fireEvent.change(bankCodeInput, { target: { value: '014' } });

      await waitFor(() => {
        expect(screen.queryByText(/Bank Code is required/i)).not.toBeInTheDocument();
      });
    });

    test('does not generate when validation fails', async () => {
      vi.mocked(miniQRGenerator.validateMiniQRInput).mockReturnValue(['Bank Code is required']);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Bank Code is required/i)).toBeInTheDocument();
      });

      expect(miniQRGenerator.generateMiniQR).not.toHaveBeenCalled();
    });
  });

  describe('QR Generation', () => {
    test('generates Mini QR code with valid data', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(miniQRGenerator.generateMiniQR).toHaveBeenCalledWith({
          bankCode: '014',
          transactionId: '202602078Buvov9xGKBPqxhso',
          countryCode: 'TH'
        });
      });
    });

    test('calls onQRGenerated callback on successful generation', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnQRGenerated).toHaveBeenCalledWith(mockResult.qrString);
      });
    });

    test('handles generation error', async () => {
      vi.mocked(miniQRGenerator.generateMiniQR).mockRejectedValue(
        new Error('Generation failed')
      );

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
      });
    });

    test('handles generic error without message', async () => {
      vi.mocked(miniQRGenerator.generateMiniQR).mockRejectedValue('Unknown error');

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate QR code/i)).toBeInTheDocument();
      });
    });

    test('disables generate button during generation', async () => {
      vi.mocked(miniQRGenerator.generateMiniQR).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          qrString: 'test',
          qrCodeDataURL: 'data:image/png;base64,test'
        }), 100))
      );

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      expect(generateButton).toBeDisabled();
      expect(screen.getByText(/Generating.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    test('does not call onQRGenerated when generation fails', async () => {
      vi.mocked(miniQRGenerator.generateMiniQR).mockRejectedValue(
        new Error('Generation failed')
      );

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
      });

      expect(mockOnQRGenerated).not.toHaveBeenCalled();
    });

    test('displays QR code image when generated', async () => {
      const mockResult = {
        qrString: '00020101',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const qrImage = screen.getByAltText(/Generated Thai QR Code/i);
        expect(qrImage).toBeInTheDocument();
        expect(qrImage).toHaveAttribute('src', mockResult.qrCodeDataURL);
      });
    });
  });

  describe('Live Preview', () => {
    test('generates preview when required fields are filled', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      // Advance timer by 500ms (debounce delay)
      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(miniQRGenerator.generateMiniQR).toHaveBeenCalledWith({
          bankCode: '014',
          transactionId: '202602078Buvov9xGKBPqxhso',
          countryCode: 'TH'
        });
      });
    });

    test('debounces preview generation', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      // Type multiple times
      fireEvent.change(bankCodeInput, { target: { value: '0' } });
      await vi.advanceTimersByTimeAsync(100);
      fireEvent.change(bankCodeInput, { target: { value: '01' } });
      await vi.advanceTimersByTimeAsync(100);
      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      // Should not have called generate yet
      expect(miniQRGenerator.generateMiniQR).not.toHaveBeenCalled();

      // Advance timer by 500ms
      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(miniQRGenerator.generateMiniQR).toHaveBeenCalledTimes(1);
      });
    });

    test('does not generate preview when required fields are missing', async () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });

      await vi.advanceTimersByTimeAsync(500);

      expect(miniQRGenerator.generateMiniQR).not.toHaveBeenCalled();
    });

    test('silently handles preview generation errors', async () => {
      vi.mocked(miniQRGenerator.generateMiniQR).mockRejectedValue(
        new Error('Preview generation failed')
      );

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      await vi.advanceTimersByTimeAsync(500);

      // Should not display error message for preview failures
      await waitFor(() => {
        expect(screen.queryByText(/Preview generation failed/i)).not.toBeInTheDocument();
      });
    });

    test('clears preview when required fields are removed', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      // Fill fields
      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(miniQRGenerator.generateMiniQR).toHaveBeenCalled();
      });

      // Clear a required field
      fireEvent.change(bankCodeInput, { target: { value: '' } });

      // Preview should not be shown anymore
      expect(screen.queryByAltText(/Generated Thai QR Code/i)).not.toBeInTheDocument();
    });

    test('cleans up debounce timer on unmount', async () => {
      const { unmount } = render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      // Unmount before debounce completes
      unmount();

      await vi.advanceTimersByTimeAsync(500);

      // Should not have called generate after unmount
      expect(miniQRGenerator.generateMiniQR).not.toHaveBeenCalled();
    });
  });

  describe('Sample Data', () => {
    test('loads sample data when load sample button is clicked', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const loadSampleButton = screen.getByRole('button', { name: /Load Sample/i });
      fireEvent.click(loadSampleButton);

      expect(screen.getByLabelText(/Bank Code/i)).toHaveValue('014');
      expect(screen.getByLabelText(/Transaction ID/i)).toHaveValue('202602078Buvov9xGKBPqxhso');
      expect(screen.getByLabelText(/Country Code/i)).toHaveValue('TH');
    });

    test('clears generated QR when loading sample', () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      // Generate QR first
      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      // Load sample
      const loadSampleButton = screen.getByRole('button', { name: /Load Sample/i });
      fireEvent.click(loadSampleButton);

      // Should reset to sample data
      expect(screen.getByLabelText(/Bank Code/i)).toHaveValue('014');
      expect(screen.getByLabelText(/Transaction ID/i)).toHaveValue('202602078Buvov9xGKBPqxhso');
    });

    test('clears errors when loading sample', async () => {
      vi.mocked(miniQRGenerator.validateMiniQRInput).mockReturnValue(['Bank Code is required']);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Bank Code is required/i)).toBeInTheDocument();
      });

      const loadSampleButton = screen.getByRole('button', { name: /Load Sample/i });
      fireEvent.click(loadSampleButton);

      expect(screen.queryByText(/Bank Code is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Clear Form', () => {
    test('clears form when clear button is clicked', () => {
      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      // Fill in data first
      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);
      const countryCodeInput = screen.getByLabelText(/Country Code/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });
      fireEvent.change(countryCodeInput, { target: { value: 'US' } });

      // Clear the form
      const clearButton = screen.getByRole('button', { name: /Clear Form/i });
      fireEvent.click(clearButton);

      expect(bankCodeInput).toHaveValue('');
      expect(transactionIdInput).toHaveValue('');
      expect(countryCodeInput).toHaveValue('TH'); // Reset to default
    });

    test('clears generated QR when clearing form', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      // Generate QR
      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByAltText(/Generated Thai QR Code/i)).toBeInTheDocument();
      });

      // Clear the form
      const clearButton = screen.getByRole('button', { name: /Clear Form/i });
      fireEvent.click(clearButton);

      expect(screen.queryByAltText(/Generated Thai QR Code/i)).not.toBeInTheDocument();
    });

    test('clears errors when clearing form', async () => {
      vi.mocked(miniQRGenerator.validateMiniQRInput).mockReturnValue(['Bank Code is required']);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Bank Code is required/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /Clear Form/i });
      fireEvent.click(clearButton);

      expect(screen.queryByText(/Bank Code is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Optional Callback', () => {
    test('works without onQRGenerated callback', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(miniQRGenerator.generateMiniQR).toHaveBeenCalled();
        expect(screen.getByAltText(/Generated Thai QR Code/i)).toBeInTheDocument();
      });

      // Should not throw error when callback is undefined
    });
  });

  describe('QRPreview Integration', () => {
    test('passes correct props to QRPreview for preview mode', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        // Check that live badge is shown (displays "Live" text)
        expect(screen.getByText(/^Live$/i)).toBeInTheDocument();
      });
    });

    test('passes correct props to QRPreview after generation', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        // Preview badge should not be shown after generation
        expect(screen.queryByText(/Live Preview/i)).not.toBeInTheDocument();
      });
    });

    test('displays Mini QR type in preview', async () => {
      const mockResult = {
        qrString: '00020101021153037645802TH6304ABCD',
        qrCodeDataURL: 'data:image/png;base64,mockdata'
      };

      vi.mocked(miniQRGenerator.generateMiniQR).mockResolvedValue(mockResult);

      render(<MiniQRGenerator onQRGenerated={mockOnQRGenerated} />);

      // QRPreview should show "Mini QR" type label
      expect(screen.getByText('Mini QR')).toBeInTheDocument();

      const bankCodeInput = screen.getByLabelText(/Bank Code/i);
      const transactionIdInput = screen.getByLabelText(/Transaction ID/i);

      fireEvent.change(bankCodeInput, { target: { value: '014' } });
      fireEvent.change(transactionIdInput, { target: { value: '202602078Buvov9xGKBPqxhso' } });

      // Click generate button to create QR
      const generateButton = screen.getByRole('button', { name: /Generate Mini QR/i });
      fireEvent.click(generateButton);

      // Wait for the QR to be generated
      await waitFor(() => {
        expect(screen.getByAltText(/Generated Thai QR Code/i)).toBeInTheDocument();
      });

      // Mini QR type should still be displayed
      expect(screen.getByText('Mini QR')).toBeInTheDocument();
    });
  });
});
