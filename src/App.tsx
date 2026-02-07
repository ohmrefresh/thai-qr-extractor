import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import { useHistory, useQRData } from './hooks';
import { toast } from 'sonner';
import AppHeader from './components/AppHeader';
import { AlertIcon } from './components/icons';

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
      <AppHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        historyCount={history.length}
        onHistoryToggle={toggleHistory}
      />
      
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
                        <AlertIcon width={16} height={16} />
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
