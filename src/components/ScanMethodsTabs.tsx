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

const ScanMethodsTabs: React.FC<ScanMethodsTabsProps> = ({
  onCameraScan,
  onFileScan,
  onTextScan,
  onError
}) => {
  const [activeMethod, setActiveMethod] = useState<ScanMethod>('camera');

  const methods: { id: ScanMethod; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'camera',
      label: 'Camera',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      ),
      description: 'Scan QR codes using your camera'
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
      ),
      description: 'Upload QR code from image file'
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
      ),
      description: 'Paste QR code string directly'
    }
  ];

  return (
    <div className="scan-methods-container">
      {/* Method Tabs */}
      <div className="scan-method-tabs">
        {methods.map((method) => (
          <button
            key={method.id}
            className={`scan-method-tab ${activeMethod === method.id ? 'active' : ''}`}
            onClick={() => setActiveMethod(method.id)}
          >
            <div className="tab-icon">{method.icon}</div>
            <div className="tab-content">
              <strong>{method.label}</strong>
              <span>{method.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Method Content - Fixed Height Container */}
      <div className="scan-method-content">
        <div className="tab-panel-container">
          <Suspense fallback={
            <div className="tab-loading">
              <div className="spinner-small"></div>
              <span>Loading...</span>
            </div>
          }>
            {activeMethod === 'camera' && (
              <div className="tab-panel tab-panel-active">
                <QRScanner
                  onScanSuccess={onCameraScan}
                  onScanError={onError}
                />
              </div>
            )}
            {activeMethod === 'file' && (
              <div className="tab-panel tab-panel-active">
                <FileUpload
                  onScanSuccess={onFileScan}
                  onScanError={onError}
                />
              </div>
            )}
            {activeMethod === 'text' && (
              <div className="tab-panel tab-panel-active">
                <TextInput
                  onScanSuccess={onTextScan}
                  onScanError={onError}
                />
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ScanMethodsTabs;
