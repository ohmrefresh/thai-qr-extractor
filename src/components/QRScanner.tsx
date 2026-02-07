import React, { useState, useRef } from 'react';
import { parseThaiQR } from '../utils/thaiQRParser';
import { useCamera } from '../hooks/useCamera';

interface QRScannerProps {
  onScanSuccess: (data: any) => void;
  onScanError: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [scanStatus, setScanStatus] = useState('Camera idle. Start scanning to decode a QR code.');
  const containerIdRef = useRef<string>(`qr-reader-${Math.random().toString(36).slice(2, 10)}`);

  const handleScanSuccess = (decodedText: string) => {
    try {
      const parsedData = parseThaiQR(decodedText);
      onScanSuccess(parsedData);
      setScanStatus('QR code captured successfully.');
    } catch (error) {
      onScanError(`Failed to parse QR code: ${error}`);
      setScanStatus('Detected data could not be parsed. Keep the QR code steady and try again.');
    }
  };

  const {
    availableCameras,
    selectedCameraId,
    cameraError,
    isLoadingCameras,
    isStarting,
    isScanning,
    isStopping,
    startScanning,
    stopScanning,
    handleCameraChange,
    handleRefreshCameras,
  } = useCamera({
    containerId: containerIdRef.current,
    onScanSuccess: handleScanSuccess,
    onScanError,
  });

  // Update scan status based on camera state
  React.useEffect(() => {
    if (cameraError) {
      setScanStatus('Camera error. Check permissions and try again.');
    } else if (isScanning) {
      setScanStatus('Camera active. Align the QR code within the frame.');
    } else if (isStarting) {
      setScanStatus('Starting camera...');
    } else {
      setScanStatus('Camera idle. Start scanning to decode a QR code.');
    }
  }, [cameraError, isScanning, isStarting]);

  const statusPillClass = cameraError
    ? 'status-pill status-pill--attention'
    : isScanning
      ? 'status-pill status-pill--live'
      : isStarting
        ? 'status-pill status-pill--starting'
        : 'status-pill';

  const statusLabel = cameraError
    ? 'Requires attention'
    : isScanning
      ? 'Live'
      : isStarting
        ? 'Starting...'
        : 'Idle';

  return (
    <div className="qr-scanner">
      <div className="card-header">
        <div className="card-icon accent-camera">
          <svg className="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </div>
        <div>
          <h3 className="card-title">Camera scanner</h3>
          <p className="card-subtitle">Use your device camera to decode Thai QR codes instantly.</p>
        </div>
      </div>

      <div className="scanner-meta">
        <label className="camera-select">
          <span>Camera</span>
          <select
            value={selectedCameraId}
            onChange={handleCameraChange}
            disabled={isLoadingCameras || availableCameras.length === 0 || isStarting}
          >
            {availableCameras.length === 0 && <option value="">No cameras detected</option>}
            {availableCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || 'Camera'}
              </option>
            ))}
          </select>
        </label>

        <div className="scanner-meta-actions">
          <button
            type="button"
            className="camera-refresh-button"
            onClick={handleRefreshCameras}
            disabled={isLoadingCameras || isStarting}
            title="Refresh camera devices"
          >
            <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
              <path d="M20.49 15A9 9 0 0 1 5.64 18.36L1 14"></path>
            </svg>
            Refresh
          </button>

          <span className={statusPillClass}>{statusLabel}</span>
        </div>
      </div>

      {cameraError && (
        <div className="inline-error" role="alert">
          <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="13"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
          <span>{cameraError}</span>
        </div>
      )}

      <div className="scanner-controls">
        {!isScanning ? (
          <button
            onClick={() => startScanning()}
            className="scan-button"
            disabled={isStarting || availableCameras.length === 0}
          >
            <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
              <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
              <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
              <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
            </svg>
            {isStarting ? 'Starting...' : 'Start camera scanner'}
          </button>
        ) : (
          <button onClick={() => stopScanning()} className="stop-button" disabled={isStopping}>
            <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
            {isStopping ? 'Stopping...' : 'Stop scanner'}
          </button>
        )}
      </div>

      <div className={`qr-reader-frame ${isScanning ? 'qr-reader-frame--active' : ''}`}>
        <div id={containerIdRef.current} className="qr-reader"></div>
        {!isScanning && (
          <div className="scanner-placeholder">
            {isStarting ? (
              <>
                <div className="spinner"></div>
                <p>Starting camera...</p>
              </>
            ) : (
              <>
                <svg className="icon icon-lg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"></path>
                  <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
                  <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
                  <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
                  <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
                </svg>
                <p>Start the scanner to stream and decode QR codes in real time.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="scan-status">{scanStatus}</div>
    </div>
  );
};

export default QRScanner;
