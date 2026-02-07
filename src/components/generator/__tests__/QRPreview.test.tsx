import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import QRPreview from '../QRPreview';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('QRPreview Component', () => {
  const mockResult = {
    qrString: '00020101021129370016A0000006770101110213012345678901265303764',
    qrCodeDataURL: 'data:image/png;base64,mockQRData',
  };

  const mockMiniQRResult = {
    qrString: '00020101021229370016A0000006770101120213000123456789012304500012345678901234',
    qrCodeDataURL: 'data:image/png;base64,mockMiniQRData',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  test('renders empty state when no result', () => {
    render(<QRPreview result={null} />);
    
    expect(screen.getByText(/Ready to Generate/i)).toBeInTheDocument();
    expect(screen.getByText(/Fill in the required fields to preview your QR code/i)).toBeInTheDocument();
  });

  test('renders generating indicator when isGenerating is true', () => {
    render(<QRPreview result={null} isGenerating={true} />);
    
    expect(screen.getByText(/Generating.../i)).toBeInTheDocument();
  });

  test('renders QR code preview with result', () => {
    render(<QRPreview result={mockResult} />);
    
    const qrImage = screen.getByAltText(/Generated Thai QR Code/i);
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute('src', mockResult.qrCodeDataURL);
  });

  test('displays Live badge when isPreview is true', () => {
    render(<QRPreview result={mockResult} isPreview={true} />);
    
    expect(screen.getByText(/Live/i)).toBeInTheDocument();
  });

  test('does not display Live badge when isPreview is false', () => {
    render(<QRPreview result={mockResult} isPreview={false} />);
    
    expect(screen.queryByText(/^Live$/i)).not.toBeInTheDocument();
  });

  test('displays Bill Payment label by default', () => {
    render(<QRPreview result={mockResult} />);
    
    expect(screen.getByText(/Bill Payment/i)).toBeInTheDocument();
  });

  test('displays Credit Transfer label for credit transfer type', () => {
    const { container } = render(
      <QRPreview 
        result={mockResult} 
        standardQRData={{ paymentType: 'credit-transfer' }}
      />
    );
    
    // Check subtitle specifically
    const subtitle = container.querySelector('.qr-preview-subtitle');
    expect(subtitle).toHaveTextContent('Credit Transfer');
  });

  test('displays Mini QR label for mini QR type', () => {
    render(
      <QRPreview 
        result={mockMiniQRResult} 
        isMiniQR={true}
        miniQRData={{ bankCode: '004', transactionId: 'TXN123456' }}
      />
    );
    
    expect(screen.getByText(/Mini QR/i)).toBeInTheDocument();
  });

  test('displays mini QR data details', () => {
    render(
      <QRPreview 
        result={mockMiniQRResult} 
        isMiniQR={true}
        miniQRData={{ bankCode: '004', transactionId: 'TXN123456789' }}
      />
    );
    
    expect(screen.getByText(/Bank Code/i)).toBeInTheDocument();
    expect(screen.getByText('004')).toBeInTheDocument();
    expect(screen.getByText(/Transaction ID/i)).toBeInTheDocument();
    expect(screen.getByText('TXN123456789')).toBeInTheDocument();
  });

  test('displays standard QR details for bill payment', () => {
    const { container } = render(
      <QRPreview 
        result={mockResult} 
        standardQRData={{ paymentType: 'bill-payment' }}
      />
    );
    
    expect(screen.getByText(/Payment Type/i)).toBeInTheDocument();
    // Check the specific detail value
    const detailValue = container.querySelector('.qr-detail-value');
    expect(detailValue).toHaveTextContent('Bill Payment');
  });

  test('displays amount for standard QR when provided', () => {
    render(
      <QRPreview 
        result={mockResult} 
        standardQRData={{ paymentType: 'credit-transfer', amount: 1500.50 }}
      />
    );
    
    expect(screen.getByText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByText('฿1,500.50')).toBeInTheDocument();
  });

  test('toggles QR string visibility when clicked', () => {
    render(<QRPreview result={mockResult} />);
    
    const toggleButton = screen.getByText(/QR String Data/i);
    expect(toggleButton).toBeInTheDocument();
    
    // Initially QR string should not be visible
    expect(screen.queryByText(mockResult.qrString)).not.toBeInTheDocument();
    
    // Click to show
    fireEvent.click(toggleButton);
    expect(screen.getByText(mockResult.qrString)).toBeInTheDocument();
    
    // Click to hide
    fireEvent.click(toggleButton);
    expect(screen.queryByText(mockResult.qrString)).not.toBeInTheDocument();
  });

  test('shows error toast when downloading without QR code', async () => {
    render(<QRPreview result={{ qrString: '', qrCodeDataURL: '' }} />);
    
    const downloadButton = screen.getByText(/Download PNG/i);
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No QR code available to download');
    });
  });

  test('shows error toast when copying without QR string', async () => {
    render(<QRPreview result={{ qrString: '', qrCodeDataURL: '' }} />);
    
    const copyButton = screen.getByText(/Copy String/i);
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No QR string available to copy');
    });
  });

  test('copies QR string to clipboard when copy button is clicked', async () => {
    render(<QRPreview result={mockResult} />);
    
    const copyButton = screen.getByText(/Copy String/i);
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResult.qrString);
      expect(toast.success).toHaveBeenCalledWith('QR string copied to clipboard');
    });
  });

  test('download button handles click', async () => {
    render(<QRPreview result={mockResult} />);
    
    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    
    // Button should be initially enabled
    expect(downloadButton).toBeEnabled();
    
    // Click should trigger download (even though it will fail in test env)
    fireEvent.click(downloadButton);
    
    // Wait for success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('QR code downloaded successfully');
    });
  });

  test('disables copy button while copying', async () => {
    render(<QRPreview result={mockResult} />);
    
    const copyButton = screen.getByRole('button', { name: /Copy String/i });
    fireEvent.click(copyButton);
    
    // Button should show loading state
    expect(screen.getByText(/Copying.../i)).toBeInTheDocument();
  });

  test('renders QR code frame elements', () => {
    const { container } = render(<QRPreview result={mockResult} />);
    
    // Check for frame corners
    expect(container.querySelector('.qr-frame-corner')).toBeInTheDocument();
    expect(container.querySelector('.qr-frame-tl')).toBeInTheDocument();
    expect(container.querySelector('.qr-frame-tr')).toBeInTheDocument();
    expect(container.querySelector('.qr-frame-bl')).toBeInTheDocument();
    expect(container.querySelector('.qr-frame-br')).toBeInTheDocument();
  });

  test('renders QR code icon in header', () => {
    const { container } = render(<QRPreview result={mockResult} />);
    
    const typeIcon = container.querySelector('.qr-preview-type-icon');
    expect(typeIcon).toBeInTheDocument();
  });

  test('applies different theme colors based on QR type', () => {
    const { container, rerender } = render(
      <QRPreview result={mockResult} isMiniQR={true} />
    );
    
    const miniQRIcon = container.querySelector('.qr-preview-type-icon');
    expect(miniQRIcon).toHaveStyle({ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' });
    
    rerender(<QRPreview result={mockResult} standardQRData={{ paymentType: 'credit-transfer' }} />);
    
    const creditTransferIcon = container.querySelector('.qr-preview-type-icon');
    expect(creditTransferIcon).toHaveStyle({ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' });
    
    rerender(<QRPreview result={mockResult} standardQRData={{ paymentType: 'bill-payment' }} />);
    
    const billPaymentIcon = container.querySelector('.qr-preview-type-icon');
    expect(billPaymentIcon).toHaveStyle({ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' });
  });

  test('renders preview title and subtitle', () => {
    render(<QRPreview result={mockResult} />);
    
    expect(screen.getByText(/QR Code Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Bill Payment/i)).toBeInTheDocument();
  });
});
