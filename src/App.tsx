import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import { useHistory, useQRData } from './hooks';
import { toast } from 'sonner';

// Lazy load components to reduce initial bundle size
const ScanMethodsTabs = lazy(() => import('./components/ScanMethodsTabs'));
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
                <div className="scan-container">
                  {/* Header */}
                  <div className="scan-header">
                    <div className="header-title">
                      <div className="card-icon accent-scan">
                        <svg className="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"></path>
                          <path d="M3 7l9-4 9 4"></path>
                        </svg>
                      </div>
                      <div>
                        <h2>QR Code Scanner</h2>
                        <p>Scan, upload, or paste Thai QR codes</p>
                      </div>
                    </div>
                  </div>

                  {/* Scan Methods Tabs */}
                  <ScanMethodsTabs
                    onCameraScan={(data) => handleScan(data, 'camera')}
                    onFileScan={(data) => handleScan(data, 'file')}
                    onTextScan={(data) => handleScan(data, 'text')}
                    onError={handleScanError}
                  />

                  {error && (
                    <div className="error-messages-modern" style={{ marginTop: '1.5rem' }}>
                      <div className="error-message-modern">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12" y2="16"></line>
                        </svg>
                        {error}
                      </div>
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
