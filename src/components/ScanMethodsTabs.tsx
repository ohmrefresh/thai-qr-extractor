import React, { useState, lazy, Suspense } from 'react';

const QRScanner = lazy(() => import('./QRScanner'));
const FileUpload = lazy(() => import('./FileUpload'));
const TextInput = lazy(() => import('./TextInput'));

interface ScanMethodsTabsProps {
  onCameraScan: (data: any) => void;
  onFileScan: (data: any) => void;
  onTextScan: (data: any) => void;
  onError: (error: string) => void;
}

type ScanMethod = 'camera' | 'file' | 'text';

const SCAN_METHOD_STORAGE_KEY = 'scanMethod';

// Remembered choice wins; otherwise touch devices start on the camera (a QR in front of
// them) and pointer devices on paste (payloads copied from logs and specs).
const getInitialScanMethod = (): ScanMethod => {
  try {
    const stored = window.localStorage.getItem(SCAN_METHOD_STORAGE_KEY);
    if (stored === 'camera' || stored === 'file' || stored === 'text') {
      return stored;
    }
  } catch {
    // Storage unavailable (private mode); fall through to the device default
  }
  const isTouch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return isTouch ? 'camera' : 'text';
};

const ScanMethodsTabs: React.FC<ScanMethodsTabsProps> = ({
  onCameraScan,
  onFileScan,
  onTextScan,
  onError
}) => {
  const [activeMethod, setActiveMethod] = useState<ScanMethod>(getInitialScanMethod);

  const selectMethod = (method: ScanMethod) => {
    setActiveMethod(method);
    try {
      window.localStorage.setItem(SCAN_METHOD_STORAGE_KEY, method);
    } catch {
      // Not persisting is fine
    }
  };

  const methods: { id: ScanMethod; label: string; icon: React.ReactNode }[] = [
    {
      id: 'camera',
      label: 'Camera',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      )
    },
    {
      id: 'file',
      label: 'Upload',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17,8 12,3 7,8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      )
    },
    {
      id: 'text',
      label: 'Paste Text',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      )
    }
  ];

  return (
    <div className="scan-methods-container">
      {/* Method Tabs */}
      <div className="scan-method-tabs">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            className={`scan-method-tab ${activeMethod === method.id ? 'active' : ''}`}
            aria-pressed={activeMethod === method.id}
            onClick={() => selectMethod(method.id)}
          >
            <div className="tab-icon" aria-hidden="true">{method.icon}</div>
            <div className="tab-content">
              <strong>{method.label}</strong>
            </div>
          </button>
        ))}
      </div>

      {/* Active Method Content */}
      <div className="scan-method-content">
        <Suspense fallback={
          <div className="scan-loading">
            <div className="spinner-small"></div>
            <span>Loading...</span>
          </div>
        }>
          {activeMethod === 'camera' && (
            <QRScanner
              onScanSuccess={onCameraScan}
              onScanError={onError}
            />
          )}
          {activeMethod === 'file' && (
            <FileUpload
              onScanSuccess={onFileScan}
              onScanError={onError}
            />
          )}
          {activeMethod === 'text' && (
            <TextInput
              onScanSuccess={onTextScan}
              onScanError={onError}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default ScanMethodsTabs;
