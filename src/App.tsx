import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import { useHistory, useQRData } from './hooks';
import { toast } from 'sonner';
import AppHeader from './components/AppHeader';
import { ScanIcon } from './components/icons';
import { ErrorMessages } from './components/shared';
import { validateThaiQR } from './utils/qrValidation';

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
    restoreHistory,
    toggleHistory,
    closeHistory
  } = useHistory();

  const handleScan = (data: any, source: 'camera' | 'file' | 'text') => {
    handleScanSuccess(data, source);
    addToHistory(data, source);
    const { isValid, issues } = validateThaiQR(data);
    if (isValid) {
      toast.success('QR code decoded: payload is valid');
    } else {
      const count = issues.filter(issue => issue.severity === 'error').length;
      toast.warning(`QR code decoded with ${count} problem${count === 1 ? '' : 's'}`);
    }
  };

  const handleHistorySelect = (data: any) => {
    handleScanSuccess(data, lastScanSource);
    setCurrentView('scan');
    closeHistory();
  };

  const handleClearHistory = () => {
    const snapshot = history;
    clearHistory();
    toast('History cleared', {
      description: `${snapshot.length} item${snapshot.length === 1 ? '' : 's'} removed.`,
      action: { label: 'Undo', onClick: () => restoreHistory(snapshot) }
    });
  };

  const handleQRGenerated = (qrString: string) => {
    try {
      const parsedData = parseAndSetQRData(qrString);
      addToHistory(parsedData, 'text');
      setCurrentView('scan');
    } catch (err) {
      // Error is already handled in parseAndSetQRData
      toast.error('The generated payload couldn\'t be decoded. This is a bug; please report it.');
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
                        <ScanIcon width={28} height={28} className="icon" />
                      </div>
                      <div>
                        <h2>Decode a QR code</h2>
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
                    <ErrorMessages errors={[error]} className="scan-error" />
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
          onClearHistory={handleClearHistory}
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
