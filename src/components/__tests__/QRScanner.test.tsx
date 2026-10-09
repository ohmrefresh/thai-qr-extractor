import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import QRScanner from '../QRScanner';
import { Html5Qrcode } from 'html5-qrcode';

// Mock Html5Qrcode
vi.mock('html5-qrcode');

describe('QRScanner Component', () => {
  let mockOnScanSuccess: ReturnType<typeof vi.fn>;
  let mockOnScanError: ReturnType<typeof vi.fn>;
  let mockHtml5QrcodeInstance: any;
  let mockGetCameras: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnScanSuccess = vi.fn();
    mockOnScanError = vi.fn();

    // Mock Html5Qrcode instance
    mockHtml5QrcodeInstance = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    // Setup mock for getCameras
    mockGetCameras = vi.fn().mockResolvedValue([
      { id: 'camera1', label: 'Front Camera' },
      { id: 'camera2', label: 'Back Camera' }
    ]);

    // Mock Html5Qrcode constructor and static method
    vi.mocked(Html5Qrcode).mockImplementation(function(this: any) {
      return mockHtml5QrcodeInstance;
    } as any);

    // @ts-ignore - Mock static method
    Html5Qrcode.getCameras = mockGetCameras;

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn()
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders QRScanner component', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      const cameraTitles = screen.getAllByText(/Camera scanner/i);
      expect(cameraTitles.length).toBeGreaterThan(0);
    });
  });

  const clickStart = () => fireEvent.click(screen.getByText(/Start Scanner/i));

  test('does not request camera access until Start is clicked', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    // Listing cameras triggers the browser permission prompt, so mounting must not do it
    await waitFor(() => {
      expect(screen.getByText(/Start Scanner/i)).toBeEnabled();
    });
    expect(Html5Qrcode.getCameras).not.toHaveBeenCalled();

    clickStart();

    await waitFor(() => {
      expect(Html5Qrcode.getCameras).toHaveBeenCalledTimes(1);
    });
  });

  test('displays camera options after starting', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });
  });

  test('shows error and does not start when no cameras are found', async () => {
    mockGetCameras.mockResolvedValue([]);

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(screen.getByText(/No camera devices found/i)).toBeInTheDocument();
    });
    expect(mockHtml5QrcodeInstance.start).not.toHaveBeenCalled();
  });

  test('handles camera access error gracefully', async () => {
    mockGetCameras.mockRejectedValue(new Error('Permission denied'));

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(screen.getByText(/Unable to access camera devices/i)).toBeInTheDocument();
    });
  });

  test('starts the first camera when start button is clicked', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(mockHtml5QrcodeInstance.start).toHaveBeenCalled();
    });
    expect(mockHtml5QrcodeInstance.start.mock.calls[0][0]).toBe('camera1');
  });

  test('stops scanning when stop button is clicked', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(screen.getByText(/Stop scanner/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Stop scanner/i));

    await waitFor(() => {
      expect(mockHtml5QrcodeInstance.stop).toHaveBeenCalled();
    });
  });

  test('releases the camera if unmounted while it is starting', async () => {
    let resolveStart: () => void = () => {};
    mockHtml5QrcodeInstance.start = vi.fn(() => new Promise<void>(resolve => { resolveStart = resolve; }));

    const { unmount } = render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(mockHtml5QrcodeInstance.start).toHaveBeenCalled();
    });

    unmount();
    resolveStart();

    await waitFor(() => {
      expect(mockHtml5QrcodeInstance.stop).toHaveBeenCalled();
      expect(mockHtml5QrcodeInstance.clear).toHaveBeenCalled();
    });
  });

  test('changes camera when dropdown value changes', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    fireEvent.click(screen.getByTitle(/Refresh camera devices/i));

    await waitFor(() => {
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });

    const cameraSelect = screen.getByRole('combobox');
    fireEvent.change(cameraSelect, { target: { value: 'camera2' } });

    await waitFor(() => {
      expect(cameraSelect).toHaveValue('camera2');
    });
  });

  test('refresh button lists cameras on demand', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    fireEvent.click(screen.getByTitle(/Refresh camera devices/i));

    await waitFor(() => {
      expect(Html5Qrcode.getCameras).toHaveBeenCalled();
      expect(screen.getByText('Front Camera')).toBeInTheDocument();
    });
  });

  test('displays status messages correctly', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    // Initial status - wait for cameras to load first
    await waitFor(() => {
      expect(screen.getByText(/Camera idle/i)).toBeInTheDocument();
    });
  });

  test('handles scanning error', async () => {
    mockHtml5QrcodeInstance.start = vi.fn().mockRejectedValue(new Error('Camera error'));

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(screen.getByText(/Unable to start the camera/i)).toBeInTheDocument();
    });
  });

  test('handles browser without mediaDevices support', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true
    });

    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);
    clickStart();

    await waitFor(() => {
      expect(screen.getByText(/Camera access is not supported/i)).toBeInTheDocument();
    });
  });

  test('displays scanner placeholder when not scanning', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      expect(screen.getByText(/Start the scanner to stream and decode/i)).toBeInTheDocument();
    });
  });

  test('shows correct status pill classes', async () => {
    render(<QRScanner onScanSuccess={mockOnScanSuccess} onScanError={mockOnScanError} />);

    await waitFor(() => {
      const idleStatus = screen.getByText('Idle');
      expect(idleStatus).toBeInTheDocument();
    });
  });
});
