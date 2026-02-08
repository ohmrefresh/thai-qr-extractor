import React from 'react';
import { ThaiQRData } from '../utils/thaiQRParser';
import { CameraIcon, FileIcon, TextIcon, CloseIcon, SmileyIcon, TrashIcon } from './icons';

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

  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setEditingItemId(null);
      setEditingName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'camera':
        return <CameraIcon width={16} height={16} />;
      case 'file':
        return <FileIcon width={16} height={16} />;
      case 'text':
        return <TextIcon width={16} height={16} />;
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
    <>
      {/* Backdrop */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`history-drawer ${isOpen ? 'is-open' : ''}`}>
        <div className="history-drawer-header">
          <div className="history-drawer-title">
            <h2>History</h2>
            <span className="history-count-badge-drawer">{historyItems.length}</span>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close history">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className="history-drawer-content">
          {historyItems.length === 0 ? (
            <div className="empty-history">
              <SmileyIcon width={48} height={48} className="icon" style={{ opacity: 0.4 }} />
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
                  <TrashIcon width={16} height={16} className="icon" />
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
                          <CloseIcon width={16} height={16} className="icon" />
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
    </>
  );
};

export default History;
