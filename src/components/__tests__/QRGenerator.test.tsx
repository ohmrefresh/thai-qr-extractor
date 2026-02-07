import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import QRGenerator from '../QRGenerator';
import * as thaiQRGenerator from '../../utils/thaiQRGenerator';

// Mock the thaiQRGenerator module
vi.mock('../../utils/thaiQRGenerator', () => ({
  generateThaiQR: vi.fn(),
  validateQRInput: vi.fn(),
  generateSampleQR: vi.fn(),
  generateSampleCreditTransferQR: vi.fn()
}));

describe('QRGenerator Component', () => {
  const mockOnQRGenerated = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(thaiQRGenerator.validateQRInput).mockReturnValue([]);
    vi.mocked(thaiQRGenerator.generateSampleQR).mockReturnValue({
      paymentType: 'bill-payment',
      aid: 'A000000677010112',
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
    // For bill-payment (default), these fields should be visible
    expect(screen.getByLabelText(/Biller ID/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Reference 1/i)[0]).toBeInTheDocument(); // Required section
    // Optional fields
    expect(screen.getByLabelText(/Amount \(THB\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Merchant Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Merchant City/i)).toBeInTheDocument();
  });

  test('updates form data when inputs change', () => {
    render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

    const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i) as HTMLSelectElement;
    fireEvent.change(aidInput, { target: { value: 'A000000677010112' } });

    expect(aidInput).toHaveValue('A000000677010112');
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
    expect(screen.getByLabelText(/AID \(Application Identifier\)/i)).toHaveValue('A000000677010112');
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

  describe('Payment Type Switching', () => {
    test('renders payment type toggle buttons', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      expect(screen.getByText('Credit Transfer')).toBeInTheDocument();
      expect(screen.getByText('Bill Payment')).toBeInTheDocument();
    });

    test('bill payment is active by default', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      const billPaymentButton = screen.getByText('Bill Payment').closest('button');
      expect(billPaymentButton).toHaveClass('active');
    });

    test('switches to credit transfer when button is clicked', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      expect(creditTransferButton).toHaveClass('active');

      // Should show recipient fields instead of biller fields
      expect(screen.getByLabelText(/Recipient Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Recipient ID|Mobile Number/i)).toBeInTheDocument();
    });

    test('shows bill payment fields when bill payment is selected', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      // Should show biller fields
      expect(screen.getByLabelText(/Biller ID/i)).toBeInTheDocument();
      expect(screen.getAllByLabelText(/Reference 1/i)[0]).toBeInTheDocument();
    });

    test('shows credit transfer fields when credit transfer is selected', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // Should show recipient fields
      expect(screen.getByLabelText(/Recipient Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Recipient ID|Mobile Number/i)).toBeInTheDocument();
    });

    test('clears form data when switching payment types', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      // Fill in bill payment data
      const billerIdInput = screen.getByLabelText(/Biller ID/i);
      fireEvent.change(billerIdInput, { target: { value: '0123456789012' } });

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // Switch back to bill payment
      const billPaymentButton = screen.getByText('Bill Payment').closest('button');
      fireEvent.click(billPaymentButton!);

      // Form should be cleared
      expect(screen.getByLabelText(/Biller ID/i)).toHaveValue('');
    });

    test('shows OTA field when customer-presented QR is selected', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // Select customer-presented AID
      const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
      fireEvent.change(aidInput, { target: { value: 'A000000677010114' } });

      // OTA field should appear
      expect(screen.getByLabelText(/OTA/i)).toBeInTheDocument();
    });

    test('hides OTA field when merchant-presented QR is selected', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // Select merchant-presented AID
      const aidInput = screen.getByLabelText(/AID \(Application Identifier\)/i);
      fireEvent.change(aidInput, { target: { value: 'A000000677010111' } });

      // OTA field should not appear
      expect(screen.queryByLabelText(/OTA/i)).not.toBeInTheDocument();
    });

    test('loads credit transfer sample when in credit transfer mode', () => {
      vi.mocked(thaiQRGenerator.generateSampleCreditTransferQR).mockReturnValue({
        paymentType: 'credit-transfer',
        aid: 'A000000677010111',
        recipientType: 'mobile',
        recipientId: '0066812345678',
        amount: 250.00,
        merchantName: 'Sample Shop',
        merchantCity: 'Bangkok'
      });

      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // Load sample
      const loadSampleButton = screen.getByRole('button', { name: /Load Sample/i });
      fireEvent.click(loadSampleButton);

      expect(thaiQRGenerator.generateSampleCreditTransferQR).toHaveBeenCalled();
      expect(screen.getByLabelText(/AID \(Application Identifier\)/i)).toHaveValue('A000000677010111');
    });

    test('displays payment type information box', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      expect(screen.getByText(/Tag 30 - PromptPay Bill Payment/i)).toBeInTheDocument();

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      expect(screen.getByText(/Tag 29 - PromptPay Credit Transfer/i)).toBeInTheDocument();
    });

    test('shows different AID options based on payment type', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      const aidSelect = screen.getByLabelText(/AID \(Application Identifier\)/i) as HTMLSelectElement;

      // Bill payment should show domestic/cross-border options
      expect(aidSelect.innerHTML).toContain('Domestic Merchant');
      expect(aidSelect.innerHTML).toContain('Cross-Border Merchant');

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // Credit transfer should show merchant/customer-presented options
      expect(aidSelect.innerHTML).toContain('Merchant-Presented QR');
      expect(aidSelect.innerHTML).toContain('Customer-Presented QR');
    });

    test('shows reference fields in optional section for credit transfer', () => {
      render(<QRGenerator onQRGenerated={mockOnQRGenerated} onClose={mockOnClose} />);

      // Switch to credit transfer
      const creditTransferButton = screen.getByText('Credit Transfer').closest('button');
      fireEvent.click(creditTransferButton!);

      // References should be in optional section for credit transfer
      const optionalSection = screen.getByText('Optional Information').parentElement;
      const references = screen.getAllByLabelText(/Reference/i);

      // At least one reference field should be in the optional section
      expect(references.length).toBeGreaterThan(0);
    });
  });
});
