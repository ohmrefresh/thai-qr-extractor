import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import QRGenerator from '../QRGenerator';
import * as thaiQRGenerator from '../../utils/thaiQRGenerator';

// Mock the thaiQRGenerator module
vi.mock('../../utils/thaiQRGenerator', () => ({
  generateThaiQR: vi.fn(),
  validateQRInput: vi.fn(),
  generateSampleQR: vi.fn()
}));

describe('QRGenerator Component', () => {
  const mockOnQRGenerated = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(thaiQRGenerator.validateQRInput).mockReturnValue([]);
    vi.mocked(thaiQRGenerator.generateSampleQR).mockReturnValue({
      aid: 'A000000677010111',
      billerId: '0123456789012',
      reference1: 'REF001',
      reference2: '',
      amount: 100,
      merchantName: 'Sample Store',
      merchantCity: 'Bangkok'
    });
  });

  test('renders QRGenerator component', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    expect(screen.getByText(/Required Information/i)).toBeInTheDocument();
    expect(screen.getByText(/QR Code Preview/i)).toBeInTheDocument();
  });

  test('renders all input fields', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/AID \(Application Identifier\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biller ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reference 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reference 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount \(THB\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Merchant Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Merchant City/i)).toBeInTheDocument();
  });

  test('updates form data when inputs change', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });

    expect(aidInput).toHaveValue('A000000677010111');
  });

  test('shows validation errors when generate is clicked with invalid data', async () => {
    vi.mocked(thaiQRGenerator.validateQRInput).mockReturnValue([
      'AID is required',
      'Biller ID is required'
    ]);

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/AID is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Biller ID is required/i)).toBeInTheDocument();
    });
  });

  test('clears validation errors when user types', async () => {
    vi.mocked(thaiQRGenerator.validateQRInput).mockReturnValue(['AID is required']);

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/AID is required/i)).toBeInTheDocument();
    });

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });

    await waitFor(() => {
      expect(screen.queryByText(/AID is required/i)).not.toBeInTheDocument();
    });
  });

  test('generates QR code with valid data', async () => {
    const mockResult = {
      qrString: '00020101021129370016A0000006770101110213012345678901265303764',
      qrCodeDataURL: 'data:image/png;base64,mockdata'
    };

    vi.mocked(thaiQRGenerator.generateThaiQR).mockResolvedValue(mockResult);

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    const billerIdInput = screen.getByLabelText(/Biller ID/i);

    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });
    fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(thaiQRGenerator.generateThaiQR).toHaveBeenCalled();
      expect(mockOnQRGenerated).toHaveBeenCalledWith(mockResult.qrString);
    });
  });

  test('handles generation error', async () => {
    vi.mocked(thaiQRGenerator.generateThaiQR).mockRejectedValue(
      new Error('Generation failed')
    );

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    const billerIdInput = screen.getByLabelText(/Biller ID/i);

    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });
    fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
    });
  });

  test('loads sample data when load sample button is clicked', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const loadSampleButton = screen.getByRole('button', { name: /Load Sample/i });
    fireEvent.click(loadSampleButton);

    expect(thaiQRGenerator.generateSampleQR).toHaveBeenCalled();
    expect(screen.getByLabelText(/AID \(Application Identifier\)/i)).toHaveValue('A000000677010111');
    expect(screen.getByLabelText(/Biller ID/i)).toHaveValue('0123456789012');
    expect(screen.getByLabelText(/Merchant Name/i)).toHaveValue('Sample Store');
  });

  test('clears form when clear button is clicked', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    // Fill in data first
    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });

    // Clear the form
    const clearButton = screen.getByRole('button', { name: /Clear Form/i });
    fireEvent.click(clearButton);

    expect(aidInput).toHaveValue('');
  });

  test('displays QR code image when generated', async () => {
    const mockResult = {
      qrString: '00020101',
      qrCodeDataURL: 'data:image/png;base64,mockdata'
    };

    vi.mocked(thaiQRGenerator.generateThaiQR).mockResolvedValue(mockResult);

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    const billerIdInput = screen.getByLabelText(/Biller ID/i);

    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });
    fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      const qrImage = screen.getByAltText(/Generated Thai QR Code/i);
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', mockResult.qrCodeDataURL);
    });
  });

  test('displays generated QR string', async () => {
    const mockResult = {
      qrString: '00020101021129370016A0000006770101110213012345678901265303764',
      qrCodeDataURL: 'data:image/png;base64,mockdata'
    };

    vi.mocked(thaiQRGenerator.generateThaiQR).mockResolvedValue(mockResult);

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    const billerIdInput = screen.getByLabelText(/Biller ID/i);

    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });
    fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockResult.qrString)).toBeInTheDocument();
    });
  });

  test('disables generate button during generation', async () => {
    vi.mocked(thaiQRGenerator.generateThaiQR).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    const billerIdInput = screen.getByLabelText(/Biller ID/i);

    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });
    fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    expect(generateButton).toBeDisabled();

    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });
  });

  test('handles amount input correctly', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const amountInput = screen.getByLabelText(/Amount \(THB\)/i);
    fireEvent.change(amountInput, { target: { value: '100.50' } });

    expect(amountInput).toHaveValue(100.5);
  });

  test('handles optional fields correctly', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const ref2Input = screen.getByLabelText(/Reference 2/i);
    fireEvent.change(ref2Input, { target: { value: '' } });

    expect(ref2Input).toHaveValue('');
  });

  test('calls onClose when close button is clicked', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText(/Close generator/i);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not call onQRGenerated when generation fails', async () => {
    vi.mocked(thaiQRGenerator.generateThaiQR).mockRejectedValue(
      new Error('Generation failed')
    );

    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
    const billerIdInput = screen.getByLabelText(/Biller ID/i);

    fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });
    fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

    const generateButton = screen.getByRole('button', { name: /Generate QR Code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
    });

    expect(mockOnQRGenerated).not.toHaveBeenCalled();
  });
});
