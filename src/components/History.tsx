import React from 'react';
import { ThaiQRData } from '../utils/thaiQRParser';

export interface HistoryItem {
  id: string;
  data: ThaiQRData;
  timestamp: Date;
  source: 'camera' | 'file' | 'text';
  customName?: string;
}

interface HistoryProps {
  historyItems: HistoryItem[];
  onSelectItem: (data: ThaiQRData) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onRenameItem?: (id: string, customName: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const History: React.FC<HistoryProps> = ({
  historyItems,
  onSelectItem,
  onClearHistory,
  onDeleteItem,
  onRenameItem,
  isOpen,
  onClose
}) => {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

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
    if (item.customName?.trim()) {
      return item.customName;
    }

    if (item.data.merchantName) {
      return `${item.data.merchantName}${item.data.amount ? ` - ฿${item.data.amount}` : ''}`;
    }
    if (item.data.merchantId) {
      return `ID: ${item.data.merchantId}${item.data.amount ? ` - ฿${item.data.amount}` : ''}`;
    }
    return `QR Code (${item.data.version})`;
  };

  const handleStartRename = (item: HistoryItem) => {
    setEditingItemId(item.id);
    setEditingName(getDisplayTitle(item));
  };

  const handleSaveRename = (itemId: string) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;

    onRenameItem?.(itemId, trimmedName);
    setEditingItemId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingItemId(null);
    setEditingName('');
  };

  const filteredHistoryItems = historyItems.filter((item) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const displayTitle = getDisplayTitle(item).toLowerCase();
    const reference = item.data.reference?.toLowerCase() || '';
    const rawData = item.data.rawData?.toLowerCase() || '';

    return displayTitle.includes(query) || reference.includes(query) || rawData.includes(query);
  });

  return (
    <div className="history-overlay">
      <div className="history-menu">
        <div className="history-header">
          <div className="history-heading">
            <div className="card-icon accent-history">
              <svg className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            </div>
            <div>
              <h2>Scan history</h2>
              <p>Recent QR payloads captured across all methods.</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close history">
            <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="history-content">
          {historyItems.length === 0 ? (
            <div className="empty-history">
              <svg className="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
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
              <div className="history-search">
                <input
                  className="history-search-input"
                  type="text"
                  placeholder="Search history"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="history-actions">
                <button 
                  className="clear-history-button"
                  onClick={onClearHistory}
                  disabled={historyItems.length === 0}
                >
                  <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                  </svg>
                  Clear All
                </button>
                <span className="history-count">
                  {filteredHistoryItems.length} / {historyItems.length} item{historyItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="history-list">
                {filteredHistoryItems.length === 0 && (
                  <div className="empty-history-search">No matching history items</div>
                )}

                {filteredHistoryItems.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-content" onClick={() => onSelectItem(item.data)}>
                      <div className="history-item-header">
                        <div className="history-item-icon">
                          {getSourceIcon(item.source)}
                        </div>
                        <div className="history-item-title">
                          {editingItemId === item.id ? (
                            <div className="history-item-rename" onClick={(e) => e.stopPropagation()}>
                              <input
                                className="history-item-rename-input"
                                aria-label="Edit history item name"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveRename(item.id);
                                  }

                                  if (e.key === 'Escape') {
                                    handleCancelRename();
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                className="history-item-action-button"
                                aria-label="Save name"
                                onClick={() => handleSaveRename(item.id)}
                              >
                                Save
                              </button>
                              <button
                                className="history-item-action-button"
                                aria-label="Cancel edit name"
                                onClick={handleCancelRename}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            getDisplayTitle(item)
                          )}
                        </div>
                        {editingItemId !== item.id && (
                          <button
                            className="history-item-action-button"
                            aria-label="Edit name"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(item);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        <button 
                          className="delete-item-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                        >
                          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
