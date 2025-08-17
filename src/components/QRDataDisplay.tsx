import React, { useState } from 'react';
import { ThaiQRData, QRSubTag } from '../utils/thaiQRParser';

interface QRDataDisplayProps {
  data: ThaiQRData;
  onClear: () => void;
}

const QRDataDisplay: React.FC<QRDataDisplayProps> = ({ data, onClear }) => {
  // Auto-expand all fields that have sub-tags by default
  const getInitialExpandedFields = () => {
    const expanded = new Set<number>();
    data.parsedFields.forEach((field, index) => {
      if (field.subTags && field.subTags.length > 0) {
        expanded.add(index);
      }
    });
    return expanded;
  };

  const [expandedFields, setExpandedFields] = useState<Set<number>>(getInitialExpandedFields());

  const formatAmount = (amount?: number): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const toggleFieldExpansion = (index: number) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFields(newExpanded);
  };

  const renderSubTags = (subTags: QRSubTag[]) => {
    return (
      <div style={{
        background: '#f0f0f0',
        padding: '8px',
        marginLeft: '20px',
        borderLeft: '3px solid #ddd'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 80px 1fr 1fr',
          gap: '10px',
          padding: '4px 8px',
          fontWeight: 'bold',
          fontSize: '0.9em',
          color: '#555',
          borderBottom: '1px solid #ccc',
          marginBottom: '4px'
        }}>
          <span>Sub-Tag</span>
          <span>Length</span>
          <span>Value</span>
          <span>Description</span>
        </div>
        {subTags.map((subTag, subIndex) => (
          <div key={subIndex} style={{
            display: 'grid',
            gridTemplateColumns: '80px 80px 1fr 1fr',
            gap: '10px',
            padding: '4px 8px',
            fontSize: '0.9em',
            background: 'white',
            marginBottom: '2px',
            borderRadius: '2px'
          }}>
            <span style={{
              fontFamily: 'monospace',
              background: '#e8e8e8',
              padding: '2px 4px',
              borderRadius: '2px',
              fontWeight: 'bold'
            }}>{subTag.tag}</span>
            <span style={{
              fontFamily: 'monospace',
              textAlign: 'center'
            }}>{subTag.length}</span>
            <span style={{
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>{subTag.value}</span>
            <span style={{
              color: '#555',
              fontSize: '0.85em'
            }}>{subTag.description}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="qr-data-display">
      <div className="data-header">
        <h2>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', verticalAlign: 'middle' }}>
            <path d="M9 12l2 2 4-4"></path>
            <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
            <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
            <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
            <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
          </svg>
          Thai QR Code Data
        </h2>
        <button onClick={onClear} className="clear-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0 1 -2,2H7a2,2 0 0 1 -2,-2V6m3,0V4a2,2 0 0 1 2,-2h4a2,2 0 0 1 2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Clear Data
        </button>
      </div>

      <div className="summary-section">
        <h3>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', verticalAlign: 'middle' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          Summary
        </h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Version:</label>
            <span>{data.version || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Type:</label>
            <span>{data.type || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Merchant:</label>
            <span>{data.merchantName || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Merchant ID:</label>
            <span>{data.merchantId || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Amount:</label>
            <span>{formatAmount(data.amount)}</span>
          </div>
          <div className="summary-item">
            <label>Currency:</label>
            <span>{data.currency || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Reference:</label>
            <span>{data.reference || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <label>Checksum:</label>
            <span>{data.checksum || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="raw-data-section">
        <h3>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', verticalAlign: 'middle' }}>
            <polyline points="16,18 22,12 16,6"></polyline>
            <polyline points="8,6 2,12 8,18"></polyline>
          </svg>
          Raw QR Data
        </h3>
        <div className="raw-data">
          <code>{data.rawData}</code>
        </div>
      </div>

      <div className="parsed-fields-section">
        <h3>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', verticalAlign: 'middle' }}>
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Parsed Fields
        </h3>
        <p className="fields-info">Fields with sub-tags are expanded by default. Click ▼/▶ to collapse/expand</p>
        <div className="fields-table">
          <div className="table-header">
            <span>Tag</span>
            <span>Length</span>
            <span>Value</span>
            <span>Description</span>
          </div>
          {data.parsedFields.map((field, index) => (
            <div key={index} style={{
              border: '1px solid #ddd',
              marginBottom: '4px',
              borderRadius: '4px'
            }}>
              <div className="table-row" style={{
                display: 'grid',
                gridTemplateColumns: '80px 80px 1fr 1fr',
                gap: '10px',
                padding: '8px',
                background: '#f9f9f9',
                alignItems: 'center'
              }}>
                <span className="tag">
                  {field.subTags && field.subTags.length > 0 && (
                    <button
                      onClick={() => toggleFieldExpansion(index)}
                      title={expandedFields.has(index) ? 'Collapse sub-tags' : 'Expand sub-tags'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginRight: '8px',
                        fontSize: '12px',
                        color: '#666',
                        width: '16px',
                        textAlign: 'center'
                      }}
                    >
                      {expandedFields.has(index) ? '▼' : '▶'}
                    </button>
                  )}
                  {field.tag}
                </span>
                <span className="length">{field.length}</span>
                <span className="value">{field.value}</span>
                <span className="description">
                  {field.description}
                  {field.subTags && field.subTags.length > 0 && (
                    <span style={{
                      fontSize: '0.8em',
                      color: '#666',
                      fontStyle: 'italic'
                    }}> ({field.subTags.length} sub-tags)</span>
                  )}
                </span>
              </div>
              {field.subTags && field.subTags.length > 0 && expandedFields.has(index) && (
                renderSubTags(field.subTags)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRDataDisplay;