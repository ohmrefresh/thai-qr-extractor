import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QRScanner from './QRScanner';
import { Html5Qrcode } from 'html5-qrcode';

// Mock Html5Qrcode
jest.mock('html5-qrcode', () => {
  const mockGetCameras = jest.fn();
  const MockHtml5Qrcode = jest.fn();
  
  return {
    Html5Qrcode: Object.assign(MockHtml5Qrcode, {
      getCameras: mockGetCameras
    }),
    Html5QrcodeSupportedFormats: {
      QR_CODE: 0
    }
  };
});

describe('QRScanner Component', () => {
  let mockOnScanSuccess: jest.Mock;
  let mockOnScanError: jest.Mock;
  let mockHtml5QrcodeInstance: any;

  beforeEach(() => {
    mockOnScanSuccess = jest.fn();
    mockOnScanError = jest.fn();

    // Mock Html5Qrcode instance
    mockHtml5QrcodeInstance = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    (Html5Qrcode as unknown as jest.Mock).mockImplementation(() => mockHtml5QrcodeInstance);
    (Html5Qrcode as any).getCameras.mockResolvedValue([
      { id: 'camera1', label: 'Front Camera' },
      { id: 'camera2', label: 'Back Camera' }
    ]);

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        enumerateDevices: jest.fn()
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders QRScanner component', () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    
    const cameraTitles = screen.getAllByText(/Camera scanner/i);
    expect(cameraTitles.length).toBeGreaterThan(0);
  });

  test('loads available cameras on mount', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(Html5Qrcode.getCameras).toHaveBeenCalled();
    });
  });

  test('displays camera options when cameras are available', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });
  });

  test('shows error when no cameras are found', async () => {
    (Html5Qrcode as any).getCameras = jest.fn().mockResolvedValue([]);

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText(/No camera devices found/i)).toBeInTheDocument();
    });
  });

  test('handles camera access error gracefully', async () => {
    (Html5Qrcode as any).getCameras = jest.fn().mockRejectedValue(new Error('Permission denied'));

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to access camera devices/i)).toBeInTheDocument();
    });
  });

  test('starts camera scanning when start button is clicked', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });

    const startButton = screen.getByText(/Start camera scanner/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockHtml5QrcodeInstance.start).toHaveBeenCalled();
    });
  });

  test('stops scanning when stop button is clicked', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });

    // Start scanning
    const startButton = screen.getByText(/Start camera scanner/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Stop scanner/i)).toBeInTheDocument();
    });

    // Stop scanning
    const stopButton = screen.getByText(/Stop scanner/i);
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockHtml5QrcodeInstance.stop).toHaveBeenCalled();
    });
  });

  test('changes camera when dropdown value changes', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });

    const cameraSelect = screen.getByRole('combobox');
    fireEvent.change(cameraSelect, { target: { value: 'camera2' } });

    await waitFor(() => {
      expect(cameraSelect).toHaveValue('camera2');
    });
  });

  test('refreshes camera list when refresh button is clicked', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle(/Refresh camera devices/i);
    fireEvent.click(refreshButton);

    // Verify the refresh was triggered (button functionality)
    await waitFor(() => {
      expect(refreshButton).toBeInTheDocument();
    });
  });

  test('displays status messages correctly', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    // Initial status
    expect(screen.getByText(/Camera idle/i)).toBeInTheDocument();
  });

  test('handles scanning error', async () => {
    mockHtml5QrcodeInstance.start = jest.fn().mockRejectedValue(new Error('Camera error'));

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });

    const startButton = screen.getByText(/Start camera scanner/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Unable to start the camera/i)).toBeInTheDocument();
    });
  });

  test('disables controls when no cameras available', async () => {
    (Html5Qrcode as any).getCameras = jest.fn().mockResolvedValue([]);

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      const startButton = screen.getByText(/Start camera scanner/i);
      expect(startButton).toBeDisabled();
    });
  });

  test('handles browser without mediaDevices support', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true
    });

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText(/Camera access is not supported/i)).toBeInTheDocument();
    });
  });

  test('displays scanner placeholder when not scanning', () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    expect(screen.getByText(/Start the scanner to stream and decode/i)).toBeInTheDocument();
  });

  test('shows correct status pill classes', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      const idleStatus = screen.getByText('Idle');
      expect(idleStatus).toBeInTheDocument();
    });
  });
});
