import React, { useState, useRef } from 'react';
import { parseThaiQR } from '../utils/thaiQRParser';
import { useCamera } from '../hooks/useCamera';
import { CameraIcon, RefreshIcon, ErrorIcon, StopIcon } from './icons';

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
          <CameraIcon width={26} height={26} />
        </div>
        <div>
          <h3 className="card-title">Camera Scanner</h3>
          <p className="card-subtitle">Use your device camera to decode Thai QR codes instantly</p>
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
            aria-label="Refresh camera devices"
          >
            <RefreshIcon width={18} height={18} />
          </button>

          <span className={statusPillClass}>{statusLabel}</span>
        </div>
      </div>

      {cameraError && (
        <div className="inline-error" role="alert">
          <ErrorIcon width={20} height={20} />
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
            <CameraIcon width={22} height={22} />
            {isStarting ? 'Starting...' : 'Start Scanner'}
          </button>
        ) : (
          <button onClick={() => stopScanning()} className="stop-button" disabled={isStopping}>
            <StopIcon width={20} height={20} />
            {isStopping ? 'Stopping...' : 'Stop Scanner'}
          </button>
        )}
      </div>

      <div className={`qr-reader-frame ${isScanning ? 'qr-reader-frame--active' : ''}`}>
        <div id={containerIdRef.current} className="qr-reader"></div>
        
        {/* Scanning Animation Overlay */}
        {isScanning && (
          <div className="scanner-scanning-overlay" aria-hidden="true">
            {/* Corner markers */}
            <div className="scanner-corner scanner-corner--tl" />
            <div className="scanner-corner scanner-corner--tr" />
            <div className="scanner-corner scanner-corner--bl" />
            <div className="scanner-corner scanner-corner--br" />
          </div>
        )}
        
        {!isScanning && (
          <div className="scanner-placeholder">
            {isStarting ? (
              <>
                <div className="spinner"></div>
                <p>Starting camera...</p>
              </>
            ) : (
              <>
                <div className="scanner-placeholder-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"></path>
                    <path d="M3 7l9-4 9 4"></path>
                  </svg>
                </div>
                <p>Start the scanner to stream and decode QR codes in real time.</p>
                <div className="scan-line"></div>
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
