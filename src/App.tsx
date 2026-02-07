import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import { useHistory, useQRData } from './hooks';
import { toast } from 'sonner';

// Lazy load components to reduce initial bundle size
const QRScanner = lazy(() => import('./components/QRScanner'));
const FileUpload = lazy(() => import('./components/FileUpload'));
const TextInput = lazy(() => import('./components/TextInput'));
const QRDataDisplay = lazy(() => import('./components/QRDataDisplay'));
const QRGenerator = lazy(() => import('./components/QRGenerator'));
const MiniQRGenerator = lazy(() => import('./components/MiniQRGenerator'));
const History = lazy(() => import('./components/History'));

type View = 'scan' | 'generate' | 'mini-qr';

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
    toast.success('QR code scanned successfully');
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
      toast.error('Failed to parse generated QR code');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <h1>Thai QR Tools</h1>
          </div>
          
          <nav className="main-nav">
            <button 
              className={`nav-tab ${currentView === 'scan' ? 'active' : ''}`}
              onClick={() => setCurrentView('scan')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"></path>
                <path d="M3 7l9-4 9 4"></path>
              </svg>
              Scan
            </button>
            <button 
              className={`nav-tab ${currentView === 'generate' ? 'active' : ''}`}
              onClick={() => setCurrentView('generate')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24 4.24l-4.24-4.24M6.34 6.34L2.1 2.1"></path>
              </svg>
              Generate
            </button>
            <button 
              className={`nav-tab ${currentView === 'mini-qr' ? 'active' : ''}`}
              onClick={() => setCurrentView('mini-qr')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Mini QR
            </button>
          </nav>

          <button 
            className="history-toggle-button"
            onClick={toggleHistory}
            title="View scan history"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            {history.length > 0 && <span className="history-count-badge">{history.length}</span>}
          </button>
        </div>
      </header>
      
      <main className="App-main">
        <Suspense fallback={<div className="loading-spinner"><div className="spinner"></div></div>}>
          {currentView === 'scan' && (
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
          )}
          
          {currentView === 'generate' && (
            <div className="generator-section">
              <QRGenerator
                onQRGenerated={handleQRGenerated}
              />
            </div>
          )}
          
          {currentView === 'mini-qr' && (
            <div className="generator-section">
              <MiniQRGenerator
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
