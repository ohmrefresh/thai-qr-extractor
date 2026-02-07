import React from 'react';
import { QRCodeIcon, ScanIcon, GenerateIcon, HistoryIcon } from './icons';

interface AppHeaderProps {
  currentView: 'scan' | 'generate';
  onViewChange: (view: 'scan' | 'generate') => void;
  historyCount: number;
  onHistoryToggle: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onViewChange,
  historyCount,
  onHistoryToggle,
}) => {
  return (
    <header className="App-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-icon">
            <QRCodeIcon width={28} height={28} />
          </div>
          <h1>Thai QR Tools</h1>
        </div>

        <nav className="main-nav">
          <button
            className={`nav-tab ${currentView === 'scan' ? 'active' : ''}`}
            onClick={() => onViewChange('scan')}
          >
            <ScanIcon width={18} height={18} />
            Scan QR Code
          </button>
          <button
            className={`nav-tab ${currentView === 'generate' ? 'active' : ''}`}
            onClick={() => onViewChange('generate')}
          >
            <GenerateIcon width={18} height={18} />
            Generate QR Code
          </button>
        </nav>

        <button
          className="history-toggle-button"
          onClick={onHistoryToggle}
          title="View scan history"
        >
          <HistoryIcon width={22} height={22} />
          {historyCount > 0 && (
            <span className="history-count-badge">{historyCount}</span>
          )}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
