import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { parseThaiQR } from '../utils/thaiQRParser';

interface QRScannerProps {
  onScanSuccess: (data: any) => void;
  onScanError: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText: string, decodedResult: any) => {
        try {
          const parsedData = parseThaiQR(decodedText);
          onScanSuccess(parsedData);
          scanner.clear();
          setIsScanning(false);
        } catch (error) {
          onScanError(`Failed to parse QR code: ${error}`);
        }
      },
      (error: any) => {
        console.warn('QR scan error:', error);
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setIsScanning(false);
    }
  };

  return (
    <div className="qr-scanner">
      <div className="scanner-controls">
        {!isScanning ? (
          <button onClick={startScanning} className="scan-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
              <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
              <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
              <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
            </svg>
            Start Camera Scanner
          </button>
        ) : (
          <button onClick={stopScanning} className="stop-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
            Stop Scanner
          </button>
        )}
      </div>
      
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '20px auto', borderRadius: '16px', overflow: 'hidden' }}>
        {!isScanning && (
          <div className="scanner-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.6 }}>
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
              <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
              <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
              <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
            </svg>
            <h3 style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600' }}>Camera Scanner</h3>
            <p style={{ margin: 0, color: '#9ca3af' }}>Click "Start Camera Scanner" to scan QR codes with your camera</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;