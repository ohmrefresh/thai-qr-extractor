import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import { useHistory, useQRData } from './hooks';

// Lazy load components to reduce initial bundle size
const QRScanner = lazy(() => import('./components/QRScanner'));
const FileUpload = lazy(() => import('./components/FileUpload'));
const TextInput = lazy(() => import('./components/TextInput'));
const QRDataDisplay = lazy(() => import('./components/QRDataDisplay'));
const QRGenerator = lazy(() => import('./components/QRGenerator'));
const History = lazy(() => import('./components/History'));

type View = 'scan' | 'generate';

function App() {
  const [currentView, setCurrentView] = useState<View>('scan');
  
  const {
    qrData,
    error,
    lastScanSource,
    handleScanSuccess,
    handleScanError,
    clearData,
    parseAndSetQRData
  } = useQRData();
  
  const {
    history,
    isHistoryOpen,
    addToHistory,
    removeFromHistory,
    renameHistoryItem,
    clearHistory,
    toggleHistory,
    closeHistory
  } = useHistory();

  const handleScan = (data: any, source: 'camera' | 'file' | 'text') => {
    handleScanSuccess(data, source);
    addToHistory(data, source);
  };

  const handleHistorySelect = (data: any) => {
    handleScanSuccess(data, lastScanSource);
    setCurrentView('scan');
    closeHistory();
  };

  const handleQRGenerated = (qrString: string) => {
    try {
      const parsedData = parseAndSetQRData(qrString);
      addToHistory(parsedData, 'text');
      setCurrentView('scan');
    } catch (err) {
      // Error is already handled in parseAndSetQRData
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Thai QR Code Tools</h1>
            <p>
              {currentView === 'scan' 
                ? 'Scan, upload, or paste Thai QR code data to extract payment information'
                : 'Generate Thai QR codes with custom merchant information'
              }
            </p>
          </div>
          <div className="header-controls">
            <div className="view-toggle">
              <button 
                className={`view-button ${currentView === 'scan' ? 'active' : ''}`}
                onClick={() => setCurrentView('scan')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 9h6v6h-6z"></path>
                  <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z"></path>
                </svg>
                Scan
              </button>
              <button 
                className={`view-button ${currentView === 'generate' ? 'active' : ''}`}
                onClick={() => setCurrentView('generate')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Generate
              </button>
            </div>
            <button 
              className="history-toggle-button"
              onClick={toggleHistory}
              title="View scan history"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              {history.length > 0 && <span className="history-count-badge">{history.length}</span>}
            </button>
          </div>
        </div>
      </header>
      
      <main className="App-main">
        <Suspense fallback={<div className="loading-spinner"><div className="spinner"></div></div>}>
          {currentView === 'scan' ? (
            <>
              {!qrData && (
                <div className="scanner-section">
                  <div className="section-heading">
                    <div>
                      <h2>Scan or import Thai QR codes</h2>
                      <p>Choose the method that fits best for capturing or pasting QR payloads.</p>
                    </div>
                    <span className="section-tag">Live tools</span>
                  </div>
                  <div className="input-methods">
                    <QRScanner
                      onScanSuccess={(data) => handleScan(data, 'camera')}
                      onScanError={handleScanError}
                    />
                    <FileUpload
                      onScanSuccess={(data) => handleScan(data, 'file')}
                      onScanError={handleScanError}
                    />
                    <TextInput
                      onScanSuccess={(data) => handleScan(data, 'text')}
                      onScanError={handleScanError}
                    />
                  </div>

                  {error && (
                    <div className="error-message" role="alert">
                      <svg
                        className="error-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="13"></line>
                        <line x1="12" y1="16" x2="12" y2="16"></line>
                      </svg>
                      <span>Error: {error}</span>
                    </div>
                  )}
                </div>
              )}

              {qrData && (
                <QRDataDisplay
                  data={qrData}
                  onClear={clearData}
                />
              )}
            </>
          ) : (
            <div className="generator-section">
              <QRGenerator
                onQRGenerated={handleQRGenerated}
              />
            </div>
          )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <History
          historyItems={history}
          onSelectItem={handleHistorySelect}
          onClearHistory={clearHistory}
          onDeleteItem={removeFromHistory}
          onRenameItem={renameHistoryItem}
          isOpen={isHistoryOpen}
          onClose={closeHistory}
        />
      </Suspense>
    </div>
  );
}

export default App;
