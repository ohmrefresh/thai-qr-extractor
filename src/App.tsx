import React, { useState, useEffect } from 'react';
import './App.css';
import QRScanner from './components/QRScanner';
import FileUpload from './components/FileUpload';
import TextInput from './components/TextInput';
import QRDataDisplay from './components/QRDataDisplay';
import QRGenerator from './components/QRGenerator';
import History, { HistoryItem } from './components/History';
import { ThaiQRData, parseThaiQR } from './utils/thaiQRParser';
import { 
  loadHistoryFromStorage, 
  addToHistory, 
  removeFromHistory, 
  clearHistory 
} from './utils/historyStorage';

function App() {
  const [qrData, setQrData] = useState<ThaiQRData | null>(null);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'scan' | 'generate'>('scan');
  const [lastScanSource, setLastScanSource] = useState<'camera' | 'file' | 'text'>('camera');

  useEffect(() => {
    const savedHistory = loadHistoryFromStorage();
    setHistory(savedHistory);
  }, []);

  const handleScanSuccess = (data: ThaiQRData, source?: 'camera' | 'file' | 'text') => {
    setQrData(data);
    setError('');
    
    const scanSource = source || lastScanSource;
    const updatedHistory = addToHistory(history, {
      data,
      source: scanSource
    });
    setHistory(updatedHistory);
  };

  const handleScanError = (error: string) => {
    setError(error);
    setQrData(null);
  };

  const clearData = () => {
    setQrData(null);
    setError('');
  };

  const handleHistorySelect = (data: ThaiQRData) => {
    setQrData(data);
    setError('');
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    const emptyHistory = clearHistory();
    setHistory(emptyHistory);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = removeFromHistory(history, id);
    setHistory(updatedHistory);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleQRGenerated = (qrString: string) => {
    try {
      const parsedData = parseThaiQR(qrString);
      setQrData(parsedData);
      setError('');
      
      // Add to history with 'generate' source
      const updatedHistory = addToHistory(history, {
        data: parsedData,
        source: 'text' // Use text as the closest source type for generated QR
      });
      setHistory(updatedHistory);
      
      // Switch to scan view to show the result
      setCurrentView('scan');
    } catch (error) {
      setError(`Failed to parse generated QR: ${error}`);
    }
  };

  const switchToScanView = () => {
    setCurrentView('scan');
  };

  const switchToGenerateView = () => {
    setCurrentView('generate');
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
                onClick={switchToScanView}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 9h6v6h-6z"></path>
                  <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z"></path>
                </svg>
                Scan
              </button>
              <button 
                className={`view-button ${currentView === 'generate' ? 'active' : ''}`}
                onClick={switchToGenerateView}
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
        {currentView === 'scan' ? (
          <>
            {!qrData && (
              <div className="scanner-section">
                <div className="input-methods">
                  <QRScanner 
                    onScanSuccess={(data) => {
                      setLastScanSource('camera');
                      handleScanSuccess(data, 'camera');
                    }}
                    onScanError={handleScanError}
                  />
                  <div className="divider">OR</div>
                  <FileUpload 
                    onScanSuccess={(data) => {
                      setLastScanSource('file');
                      handleScanSuccess(data, 'file');
                    }}
                    onScanError={handleScanError}
                  />
                  <div className="divider">OR</div>
                  <TextInput 
                    onScanSuccess={(data) => {
                      setLastScanSource('text');
                      handleScanSuccess(data, 'text');
                    }}
                    onScanError={handleScanError}
                  />
                </div>
                
                {error && (
                  <div className="error-message">
                    <p>Error: {error}</p>
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
      </main>

      <History
        historyItems={history}
        onSelectItem={handleHistorySelect}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}

export default App;
