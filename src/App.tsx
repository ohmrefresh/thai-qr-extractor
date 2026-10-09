import React, { useState, useRef, lazy, Suspense } from 'react';
import './App.css';
import { useHistory, useQRData } from './hooks';
import { toast } from 'sonner';
import AppHeader from './components/AppHeader';
import { ScanIcon } from './components/icons';
import { ErrorMessages } from './components/shared';
import { validateThaiQR } from './utils/qrValidation';
import { parseThaiQR } from './utils/thaiQRParser';
import { formatParseError } from './utils/qrUtils';

// Lazy load components to reduce initial bundle size
const ScanMethodsTabs = lazy(() => import('./components/ScanMethodsTabs'));
const QRDataDisplay = lazy(() => import('./components/QRDataDisplay'));
const QRGenerator = lazy(() => import('./components/QRGenerator'));
const History = lazy(() => import('./components/History'));

type View = 'scan' | 'generate';

function App() {
  const [currentView, setCurrentView] = useState<View>('scan');
  // The generator stays mounted once opened so its form survives switching views
  const generatorOpenedRef = useRef(false);
  if (currentView === 'generate') generatorOpenedRef.current = true;
  
  const {
    qrData,
    error,
    lastScanSource,
    handleScanSuccess,
    handleScanError,
    clearData
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
    // One verdict toast at a time: a new decode replaces the previous verdict
    if (isValid) {
      toast.success('QR code decoded: payload is valid', { id: 'decode-verdict' });
    } else {
      const count = issues.filter(issue => issue.severity === 'error').length;
      toast.warning(`QR code decoded with ${count} problem${count === 1 ? '' : 's'}`, { id: 'decode-verdict' });
    }
  };

  /** Decode an edited or generated payload; returns an error message instead of throwing */
  const decodeText = (rawData: string): string | undefined => {
    try {
      handleScan(parseThaiQR(rawData), 'text');
      return undefined;
    } catch (err) {
      return formatParseError(err);
    }
  };

  const handleInspect = (qrString: string) => {
    const error = decodeText(qrString);
    if (error) {
      toast.error('The generated payload couldn\'t be decoded. This is a bug; please report it.');
      return;
    }
    setCurrentView('scan');
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

  // Generate records the payload in History and stays on the form; "Inspect in
  // decoder" is the explicit way across.
  const handleQRGenerated = (qrString: string) => {
    try {
      addToHistory(parseThaiQR(qrString), 'text');
    } catch (err) {
      toast.error('The generated payload couldn\'t be decoded. This is a bug; please report it.');
    }
  };

  return (
    <div className="App">
      <AppHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        historyCount={history.length}
        isHistoryOpen={isHistoryOpen}
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
                  key={qrData.rawData}
                  data={qrData}
                  onClear={clearData}
                  onReparse={decodeText}
                />
              )}
            </>
          )}
          
          {generatorOpenedRef.current && (
            <div className="generator-section" hidden={currentView !== 'generate'}>
              <QRGenerator
                onQRGenerated={handleQRGenerated}
                onInspect={handleInspect}
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
