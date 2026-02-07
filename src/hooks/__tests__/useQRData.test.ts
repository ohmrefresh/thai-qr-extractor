import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useQRData } from '../useQRData';
import { parseThaiQR } from '../../utils/thaiQRParser';

// Mock thaiQRParser
vi.mock('../../utils/thaiQRParser', () => ({
  parseThaiQR: vi.fn(),
}));

describe('useQRData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('initializes with default values', () => {
    const { result } = renderHook(() => useQRData());
    
    expect(result.current.qrData).toBeNull();
    expect(result.current.error).toBe('');
    expect(result.current.lastScanSource).toBe('camera');
  });

  test('handleScanSuccess sets qrData and clears error', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    act(() => {
      result.current.handleScanSuccess(mockData);
    });
    
    expect(result.current.qrData).toEqual(mockData);
    expect(result.current.error).toBe('');
  });

  test('handleScanSuccess sets scan source when provided', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    act(() => {
      result.current.handleScanSuccess(mockData, 'upload');
    });
    
    expect(result.current.qrData).toEqual(mockData);
    expect(result.current.lastScanSource).toBe('upload');
  });

  test('handleScanError sets error and clears qrData', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    // First set some data
    act(() => {
      result.current.handleScanSuccess(mockData);
    });
    
    expect(result.current.qrData).toEqual(mockData);
    
    // Then trigger error
    act(() => {
      result.current.handleScanError('Scan failed');
    });
    
    expect(result.current.error).toBe('Scan failed');
    expect(result.current.qrData).toBeNull();
  });

  test('clearData resets qrData and error', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    // Set data and error
    act(() => {
      result.current.handleScanSuccess(mockData);
      result.current.handleScanError('Some error');
    });
    
    expect(result.current.qrData).toBeNull();
    expect(result.current.error).toBe('Some error');
    
    // Clear data
    act(() => {
      result.current.clearData();
    });
    
    expect(result.current.qrData).toBeNull();
    expect(result.current.error).toBe('');
  });

  test('parseAndSetQRData parses and sets data successfully', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockParsedData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);
    
    let returnedData;
    act(() => {
      returnedData = result.current.parseAndSetQRData('00020101');
    });
    
    expect(parseThaiQR).toHaveBeenCalledWith('00020101');
    expect(result.current.qrData).toEqual(mockParsedData);
    expect(result.current.error).toBe('');
    expect(returnedData).toEqual(mockParsedData);
  });

  test('parseAndSetQRData throws on parse errors', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockError = new Error('Invalid QR format');
    vi.mocked(parseThaiQR).mockImplementation(() => {
      throw mockError;
    });
    
    let thrownError: Error | null = null;
    
    try {
      act(() => {
        result.current.parseAndSetQRData('invalid');
      });
    } catch (err) {
      thrownError = err as Error;
    }
    
    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toBe('Failed to parse QR code: Error: Invalid QR format');
    expect(parseThaiQR).toHaveBeenCalledWith('invalid');
  });

  test('multiple scan sources can be set', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    act(() => {
      result.current.handleScanSuccess(mockData, 'camera');
    });
    expect(result.current.lastScanSource).toBe('camera');
    
    act(() => {
      result.current.handleScanSuccess(mockData, 'upload');
    });
    expect(result.current.lastScanSource).toBe('upload');
    
    act(() => {
      result.current.handleScanSuccess(mockData, 'text');
    });
    expect(result.current.lastScanSource).toBe('text');
  });

  test('scan source is not updated when not provided to handleScanSuccess', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    // Set initial source
    act(() => {
      result.current.handleScanSuccess(mockData, 'upload');
    });
    expect(result.current.lastScanSource).toBe('upload');
    
    // Call without source
    act(() => {
      result.current.handleScanSuccess(mockData);
    });
    expect(result.current.lastScanSource).toBe('upload'); // Should remain unchanged
  });

  test('clearData does not affect lastScanSource', () => {
    const { result } = renderHook(() => useQRData());
    
    const mockData = {
      rawData: '00020101',
      parsedFields: [],
    };
    
    act(() => {
      result.current.handleScanSuccess(mockData, 'upload');
    });
    expect(result.current.lastScanSource).toBe('upload');
    
    act(() => {
      result.current.clearData();
    });
    
    expect(result.current.lastScanSource).toBe('upload'); // Should remain unchanged
    expect(result.current.qrData).toBeNull();
    expect(result.current.error).toBe('');
  });
});
