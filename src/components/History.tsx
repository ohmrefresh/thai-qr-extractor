import React from 'react';
import { ThaiQRData } from '../utils/thaiQRParser';

export interface HistoryItem {
  id: string;
  data: ThaiQRData;
  timestamp: Date;
  source: 'camera' | 'file' | 'text';
}

interface HistoryProps {
  historyItems: HistoryItem[];
  onSelectItem: (data: ThaiQRData) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const History: React.FC<HistoryProps> = ({
  historyItems,
  onSelectItem,
  onClearHistory,
  onDeleteItem,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'camera':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        );
      case 'file':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
          </svg>
        );
      case 'text':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  const getDisplayTitle = (item: HistoryItem) => {
    if (item.data.merchantName) {
      return `${item.data.merchantName}${item.data.amount ? ` - ฿${item.data.amount}` : ''}`;
    }
    if (item.data.merchantId) {
      return `ID: ${item.data.merchantId}${item.data.amount ? ` - ฿${item.data.amount}` : ''}`;
    }
    return `QR Code (${item.data.version})`;
  };

  return (
    <div className="history-overlay">
      <div className="history-menu">
        <div className="history-header">
          <h2>Scan History</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="history-content">
          {historyItems.length === 0 ? (
            <div className="empty-history">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
              <p>No scan history yet</p>
              <span>Your scanned QR codes will appear here</span>
            </div>
          ) : (
            <>
              <div className="history-actions">
                <button 
                  className="clear-history-button"
                  onClick={onClearHistory}
                  disabled={historyItems.length === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                  </svg>
                  Clear All
                </button>
                <span className="history-count">{historyItems.length} item{historyItems.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="history-list">
                {historyItems.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-content" onClick={() => onSelectItem(item.data)}>
                      <div className="history-item-header">
                        <div className="history-item-icon">
                          {getSourceIcon(item.source)}
                        </div>
                        <div className="history-item-title">
                          {getDisplayTitle(item)}
                        </div>
                        <button 
                          className="delete-item-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                      <div className="history-item-details">
                        <span className="history-item-time">{formatTimestamp(item.timestamp)}</span>
                        {item.data.reference && (
                          <span className="history-item-ref">Ref: {item.data.reference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;