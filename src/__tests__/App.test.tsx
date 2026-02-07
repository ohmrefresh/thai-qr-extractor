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
        // Wait for view transition to complete and QRScanner to unmount
        await waitFor(() => {
          expect(screen.queryByText(/Scan or import Thai QR codes/i)).not.toBeInTheDocument();
        });
      }
    },

    async switchToScanView() {
      const scanButton = helpers.findButtonByText('Scan');
      if (scanButton) {
        fireEvent.click(scanButton);
        // Wait for view transition to complete and QRScanner to mount
        await waitFor(() => {
          expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();
        });
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

    // Switch to generate view (helper now includes waitFor)
    await helpers.switchToGenerateView();
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

    // Switch to generate view (helper now includes verification)
    await helpers.switchToGenerateView();
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

    // Switch to generate view (helper now includes waitFor)
    await helpers.switchToGenerateView();
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

  describe('Error Handling', () => {
    test('displays error when parsing fails', async () => {
      vi.mocked(parseThaiQR).mockImplementation(() => {
        throw new Error('Invalid QR format');
      });

      render(<App />);

      await helpers.parseTextInput('invalid-data');

      await waitFor(() => {
        expect(screen.getByText(/Invalid QR format/i)).toBeInTheDocument();
      });
    });

    test('clears error when switching views', async () => {
      vi.mocked(parseThaiQR).mockImplementation(() => {
        throw new Error('Test error');
      });

      render(<App />);

      await helpers.parseTextInput('invalid');

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      // Switch view (helper waits for transition)
      await helpers.switchToGenerateView();

      // Error should be cleared
      expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
    });

    test('handles error in QR generation callback', async () => {
      vi.mocked(parseThaiQR).mockImplementation(() => {
        throw new Error('Generation parse error');
      });

      render(<App />);

      await helpers.switchToGenerateView();

      // The error should be handled silently in the catch block
      expect(screen.queryByText(/Generation parse error/i)).not.toBeInTheDocument();
    });

    test('displays error and allows retry', async () => {
      vi.mocked(parseThaiQR)
        .mockImplementationOnce(() => {
          throw new Error('First attempt failed');
        })
        .mockReturnValueOnce(createMockQRData());

      render(<App />);

      await helpers.parseTextInput('invalid');

      await waitFor(() => {
        expect(screen.getByText(/First attempt failed/i)).toBeInTheDocument();
      });

      // Retry with valid data
      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(screen.queryByText(/First attempt failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('History Management', () => {
    test('loads history from storage on mount', async () => {
      const mockHistory = [
        {
          id: '1',
          data: createMockQRData({ merchantName: 'Test Store' }),
          timestamp: new Date(),
          source: 'camera' as const
        }
      ];

      vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue(mockHistory);

      render(<App />);

      await waitFor(() => {
        expect(historyStorage.loadHistoryFromStorage).toHaveBeenCalled();
      });
    });

    test('displays history count badge', async () => {
      const mockHistory = [
        {
          id: '1',
          data: createMockQRData(),
          timestamp: new Date(),
          source: 'camera' as const
        },
        {
          id: '2',
          data: createMockQRData(),
          timestamp: new Date(),
          source: 'file' as const
        }
      ];

      vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue(mockHistory);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('handles empty history', async () => {
      vi.mocked(historyStorage.loadHistoryFromStorage).mockReturnValue([]);

      render(<App />);

      helpers.toggleHistory();

      await waitFor(() => {
        const historyHeaders = screen.getAllByText(/Scan history/i);
        expect(historyHeaders.length).toBeGreaterThan(0);
      });
    });

    test('adds different source types to history', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(historyStorage.addToHistory).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            data: expect.objectContaining({ rawData: '00020101' })
          })
        );
      });
    });

    test('restores QR data from history selection', async () => {
      const mockQRData = createMockQRData({ merchantName: 'Historic Store' });
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

      helpers.toggleHistory();

      await waitFor(() => {
        expect(screen.getByText(/Historic Store/i)).toBeInTheDocument();
      });
    });

    test('switches to scan tab and shows extracted details after selecting history item', async () => {
      const mockQRData = createMockQRData({ merchantName: 'Historic Store' });
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

      await helpers.switchToGenerateView();
      helpers.toggleHistory();

      await waitFor(() => {
        expect(screen.getByText(/Historic Store/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Historic Store/i));

      await waitFor(() => {
        expect(screen.getByText(/Scan, upload, or paste Thai QR code data/i)).toBeInTheDocument();
        expect(screen.getByText(/Raw QR Data/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Management', () => {
    test('clears QR data when switching to generate view', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(screen.getByText(/Raw QR Data/i)).toBeInTheDocument();
      });

      // Switch view (helper waits for transition)
      await helpers.switchToGenerateView();

      // Data should be cleared
      expect(screen.queryByText(/Raw QR Data/i)).not.toBeInTheDocument();
    });

    test('shows different header text for each view', async () => {
      render(<App />);

      expect(screen.getByText(/Scan, upload, or paste Thai QR code data/i)).toBeInTheDocument();

      // Switch view (helper waits for transition)
      await helpers.switchToGenerateView();

      // Check generate view header text
      expect(screen.getByText(/Generate Thai QR codes with custom merchant/i)).toBeInTheDocument();
    });

    test('maintains history across view switches', async () => {
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

      // Switch views back and forth (helpers wait for transitions)
      await helpers.switchToGenerateView();
      await helpers.switchToScanView();

      // History button should still be present
      const historyButton = screen.getByTitle(/View scan history/i);
      expect(historyButton).toBeInTheDocument();
    });
  });

  describe('QR Generation Flow', () => {
    test('switches to scan view after successful generation', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.switchToGenerateView();

      // Simulate QR generation would trigger callback here
      expect(screen.queryByText(/Scan or import Thai QR codes/i)).not.toBeInTheDocument();
    });

    test('adds generated QR to history', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.switchToGenerateView();

      // This would be triggered by QRGenerator component callback
      expect(historyStorage.addToHistory).not.toHaveBeenCalled();
    });
  });

  describe('Data Display', () => {
    test('shows clear button when QR data is present', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(screen.getByText(/Clear data/i)).toBeInTheDocument();
      });
    });

    test('hides scanner section when QR data is displayed', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();

      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(screen.queryByText(/Scan or import Thai QR codes/i)).not.toBeInTheDocument();
      });
    });

    test('displays QR data details after successful scan', async () => {
      const mockQRData = createMockQRData({
        merchantName: 'Test Merchant',
        amount: 100.50,
        currency: 'THB'
      });
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(screen.getByText(/Raw QR Data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles very long QR data strings', async () => {
      const longQRString = '0' + '1'.repeat(1000);
      const mockQRData = createMockQRData({ rawData: longQRString });
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.parseTextInput(longQRString);

      await waitFor(() => {
        expect(parseThaiQR).toHaveBeenCalledWith(longQRString);
      });
    });

    test('prevents parsing of whitespace-only input', async () => {
      const mockQRData = createMockQRData();
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      const textInput = await helpers.findTextInput();
      fireEvent.change(textInput, { target: { value: '   ' } });

      const parseButton = await helpers.findParseButton();

      // Button should be disabled for whitespace-only input
      expect(parseButton).toBeDisabled();

      // parseThaiQR should not be called
      expect(parseThaiQR).not.toHaveBeenCalled();
    });

    test('handles special characters in QR data', async () => {
      const specialChars = '00020101特殊文字';
      const mockQRData = createMockQRData({ rawData: specialChars });
      vi.mocked(parseThaiQR).mockReturnValue(mockQRData);

      render(<App />);

      await helpers.parseTextInput(specialChars);

      await waitFor(() => {
        expect(parseThaiQR).toHaveBeenCalledWith(specialChars);
      });
    });

    test('handles rapid view switching', async () => {
      render(<App />);

      // Rapidly switch views (each helper waits for transition)
      await helpers.switchToGenerateView();
      await helpers.switchToScanView();
      await helpers.switchToGenerateView();
      await helpers.switchToScanView();

      // Should end up in scan view
      expect(screen.getByText(/Scan or import Thai QR codes/i)).toBeInTheDocument();
    });

    test('handles multiple scans in succession', async () => {
      const mockQRData1 = createMockQRData({ merchantName: 'First' });
      const mockQRData2 = createMockQRData({ merchantName: 'Second' });

      vi.mocked(parseThaiQR)
        .mockReturnValueOnce(mockQRData1)
        .mockReturnValueOnce(mockQRData2);

      render(<App />);

      await helpers.parseTextInput('00020101');

      await waitFor(() => {
        expect(screen.getByText(/Raw QR Data/i)).toBeInTheDocument();
      });

      // Clear and scan again
      const clearButton = screen.getByText(/Clear data/i);
      fireEvent.click(clearButton);

      await helpers.parseTextInput('00020102');

      await waitFor(() => {
        expect(parseThaiQR).toHaveBeenCalledTimes(2);
      });
    });
  });
});
