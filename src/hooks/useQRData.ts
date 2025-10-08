import { useState, useCallback } from 'react';
import { ThaiQRData, parseThaiQR } from '../utils/thaiQRParser';
import { ScanSource } from './useHistory';

export const useQRData = () => {
  const [qrData, setQrData] = useState<ThaiQRData | null>(null);
  const [error, setError] = useState<string>('');
  const [lastScanSource, setLastScanSource] = useState<ScanSource>('camera');

  const handleScanSuccess = useCallback((data: ThaiQRData, source?: ScanSource) => {
    setQrData(data);
    setError('');
    if (source) {
      setLastScanSource(source);
    }
  }, []);

  const handleScanError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setQrData(null);
  }, []);

  const clearData = useCallback(() => {
    setQrData(null);
    setError('');
  }, []);

  const parseAndSetQRData = useCallback((qrString: string) => {
    try {
      const parsedData = parseThaiQR(qrString);
      setQrData(parsedData);
      setError('');
      return parsedData;
    } catch (err) {
      const errorMessage = `Failed to parse QR code: ${err}`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    qrData,
    error,
    lastScanSource,
    handleScanSuccess,
    handleScanError,
    clearData,
    parseAndSetQRData
  };
};
