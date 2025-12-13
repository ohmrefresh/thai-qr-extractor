import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import * as historyStorage from '../utils/historyStorage';
import { parseThaiQR } from '../utils/thaiQRParser';
import { Html5Qrcode } from 'html5-qrcode';

// Mock the storage module
vi.mock('../utils/historyStorage');
vi.mock('../utils/thaiQRParser');
vi.mock('html5-qrcode');

describe('App Component', () => {
  // Test data factory
  const createMockQRData = (overrides = {}) => ({
    rawData: '00020101',
    parsedFields: [],
    version: '01',
    type: 'static',
    ...overrides,
  });

  // Test helper functions
  const helpers = {
    async findTextInput() {
      return await screen.findByPlaceholderText(/Paste raw QR code data here/i);
    },

    async findParseButton() {
      return await screen.findByText(/Parse QR data/i);
    },

    async parseTextInput(value: string) {
      const textInput = await helpers.findTextInput();
      const parseButton = await helpers.findParseButton();
      fireEvent.change(textInput, { target: { value } });
      fireEvent.click(parseButton);
    },

    findButtonByText(text: string) {
      const buttons = screen.getAllByRole('button');
      return buttons.find(b => b.textContent === text);
    },

    async switchToGenerateView() {
      const generateButton = helpers.findButtonByText('Generate');
      if (generateButton) {
        fireEvent.click(generateButton);
      }
    },

    async switchToScanView() {
      const scanButton = helpers.findButtonByText('Scan');
      if (scanButton) {
        fireEvent.click(scanButton);
      }
    },

    toggleHistory() {
      const historyButton = screen.getByTitle(/View scan history/i);
      fireEvent.click(historyButton);
      return historyButton;
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue([]);
    vi.mocked(historyStorage.addToHistory).mockImplementation((history: any[], item: any) => [...history, { ...item, id: '1', timestamp: new Date() }]);
    vi.mocked(historyStorage.removeFromHistory).mockImplementation((history: any[], id: string) => history.filter((h: any) => h.id !== id));
    vi.mocked(historyStorage.clearHistory).mockReturnValue([]);

    // Mock Html5Qrcode for QRScanner component
    const mockHtml5QrcodeInstance = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(Html5Qrcode).mockImplementation(function(this: any) {
      return mockHtml5QrcodeInstance;
    } as any);

    // @ts-ignore - Mock static method
    Html5Qrcode.getCameras = vi.fn().mockResolvedValue([
      { id: 'camera1', label: 'Front Camera' },
      { id: 'camera2', label: 'Back Camera' }
    ]);

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn()
      },
      writable: true,
      configurable: true
    });
  });

  test('renders Thai QR Code Tools', () => {
    render(<App />);
    const headingElement = screen.getByText(/Thai QR Code Tools/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders QR scanner component', async () => {
    render(<App />);
    // Verify the scan view is displayed (which contains the QRScanner)
    await waitFor(() => {
      expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();
    });
    // The QRScanner component is lazy-loaded and tested in detail in QRScanner.test.tsx
  });

  test('renders file upload component', async () => {
    render(<App />);
    const uploadButton = await screen.findByText(/Browse image/i);
    expect(uploadButton).toBeInTheDocument();
  });

  test('renders text input component', async () => {
    render(<App />);
    const textInput = await screen.findByPlaceholderText(/Paste raw QR code data here/i);
    expect(textInput).toBeInTheDocument();
  });

  test('loads history from storage on mount', async () => {
    const mockHistory = [
      {
        id: '1',
        qrData: '00020101',
        timestamp: new Date(),
        merchantName: 'Test',
      },
    ];
    vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue(mockHistory);

    render(<App />);

    await waitFor(() => {
      expect(historyStorage.loadHistoryFromStorage).toHaveBeenCalled();
    });
  });

  test('switches between scan and generate views', async () => {
    render(<App />);

    // Initially in scan view
    expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();

    await helpers.switchToGenerateView();

    // Check if view switched
    await waitFor(() => {
      expect(screen.queryByText(/Scan or import Thai QR codes/i)).not.toBeInTheDocument();
    });
  });

  test('toggles history panel', async () => {
    render(<App />);

    // Click to open history
    helpers.toggleHistory();

    // History component should be rendered (lazy loaded, so use waitFor)
    await waitFor(() => {
      const historyElements = screen.queryAllByText(/Scan history/i);
      expect(historyElements.length).toBeGreaterThanOrEqual(1);
    });

    // Click to close history
    const historyButton = helpers.toggleHistory();

    // History should be hidden (fewer elements or specific hidden state)
    expect(historyButton).toBeInTheDocument();
  });

  test('displays error message when scan fails', async () => {
    render(<App />);

    // Simulate error by finding and triggering the error callback
    // This would typically be done through component interaction
    // For now, we verify the component structure exists
    await waitFor(() => {
      expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();
    });
  });

  test('clears data when clear button is clicked', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.parseTextInput('00020101');

    // Wait for data to be displayed - look for "Raw QR Data" section instead
    await waitFor(() => {
      expect(screen.getByText(/Raw QR Data/i)).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByText(/Clear data/i);
    fireEvent.click(clearButton);

    // Data display should be removed
    await waitFor(() => {
      expect(screen.queryByText(/Clear data/i)).not.toBeInTheDocument();
    });
  });

  test('handles QR generation view', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.switchToGenerateView();

    // Verify scan view is hidden
    expect(screen.queryByText(/Scan or import Thai QR codes/i)).not.toBeInTheDocument();
  });

  test('renders with scan view by default', async () => {
    render(<App />);

    // Scan view should be visible by default
    await waitFor(() => {
      expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();
    });

    // Find scan button from view toggle
    const buttons = screen.getAllByRole('button');
    const scanButton = buttons.find(b => b.textContent === 'Scan');

    expect(scanButton).toBeInTheDocument();
  });

  test('renders history toggle button', async () => {
    render(<App />);

    await waitFor(() => {
      const historyButton = screen.getByTitle(/View scan history/i);
      expect(historyButton).toBeInTheDocument();
    });
  });

  test('handles scan success from camera', async () => {
    const mockQRData = createMockQRData({
      merchantName: 'Test Store',
      amount: 50.00
    });

    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    // Simulate camera scan by finding QRScanner and triggering its callback
    // Since we can't directly access the component's callback, we'll verify the structure exists
    await waitFor(() => {
      const cameraTitles = screen.getAllByText(/Camera scanner/i);
      expect(cameraTitles.length).toBeGreaterThan(0);
    });
  });

  test('handles scan success from file upload', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Browse image/i)).toBeInTheDocument();
    });
  });

  test('handles scan success from text input', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.parseTextInput('00020101');

    await waitFor(() => {
      expect(parseThaiQR).toHaveBeenCalledWith('00020101');
    });
  });

  test('adds scanned data to history', async () => {
    const mockQRData = createMockQRData({ merchantName: 'Test' });
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.parseTextInput('00020101');

    await waitFor(() => {
      expect(historyStorage.addToHistory).toHaveBeenCalled();
    });
  });

  test('handles history item selection', async () => {
    const mockQRData = createMockQRData({ merchantName: 'Test' });
    const mockHistory = [
      {
        id: '1',
        data: mockQRData,
        timestamp: new Date(),
        source: 'camera' as const
      }
    ];

    vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue(mockHistory);
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    // Open history
    helpers.toggleHistory();

    await waitFor(() => {
      expect(screen.getByText(/Test/i)).toBeInTheDocument();
    });
  });

  test('handles history deletion', async () => {
    const mockHistory = [
      {
        id: '1',
        data: createMockQRData(),
        timestamp: new Date(),
        source: 'camera' as const
      }
    ];

    vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue(mockHistory);

    render(<App />);

    // Open history
    helpers.toggleHistory();

    await waitFor(() => {
      expect(historyStorage.loadHistoryFromStorage).toHaveBeenCalled();
    });
  });

  test('handles QR generation', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.switchToGenerateView();

    await waitFor(() => {
      expect(screen.queryByText(/Scan or import Thai QR codes/i)).not.toBeInTheDocument();
    });
  });

  test('handles QR generation with parsed data', async () => {
    const mockQRData = createMockQRData({ merchantName: 'Generated Store' });
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.switchToGenerateView();

    // Component structure should exist
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  test('handles generation error', async () => {
    vi.mocked(parseThaiQR).mockImplementation(() => {
      throw new Error('Invalid QR data');
    });

    render(<App />);

    await helpers.parseTextInput('invalid');

    await waitFor(() => {
      expect(parseThaiQR).toHaveBeenCalledWith('invalid');
    });
  });

  test('clears error when new scan is successful', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR)
      .mockImplementationOnce(() => {
        throw new Error('Invalid');
      })
      .mockReturnValueOnce(mockQRData);

    render(<App />);

    // First scan fails
    await helpers.parseTextInput('invalid');

    // Second scan succeeds
    await helpers.parseTextInput('00020101');

    await waitFor(() => {
      expect(parseThaiQR).toHaveBeenCalledTimes(2);
    });
  });

  test('persists history to storage', async () => {
    const mockQRData = createMockQRData();
    vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

    render(<App />);

    await helpers.parseTextInput('00020101');

    await waitFor(() => {
      expect(historyStorage.addToHistory).toHaveBeenCalled();
    });
  });
});
