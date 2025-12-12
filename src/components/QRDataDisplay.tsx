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

  const renderSubTags = (subTags: QRSubTag[]) => (
    <div className="subtag-table">
      <div className="subtag-header">
        <span>Sub-tag</span>
        <span>Length</span>
        <span>Value</span>
        <span>Description</span>
      </div>
      {subTags.map((subTag, subIndex) => (
        <div key={subIndex} className="subtag-row">
          <span className="subtag-cell subtag-cell--tag">{subTag.tag}</span>
          <span className="subtag-cell subtag-cell--length">{subTag.length}</span>
          <span className="subtag-cell subtag-cell--value">{subTag.value}</span>
          <span className="subtag-cell subtag-cell--description">{subTag.description}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="qr-data-display">
      <div className="data-header">
        <div className="data-heading">
          <div className="card-icon accent-result">
            <svg className="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
              <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
              <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
              <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
            </svg>
          </div>
          
        </div>
        <button onClick={onClear} className="clear-button">
          <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0 1 -2,2H7a2,2 0 0 1 -2,-2V6m3,0V4a2,2 0 0 1 2,-2h4a2,2 0 0 1 2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Clear data
        </button>
      </div>

  

      <div className="raw-data-section">
        <h3 className="section-title">
          <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <h3 className="section-title">
          <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div key={index} className={`field-group ${expandedFields.has(index) ? 'is-expanded' : ''}`}>
              <div className="table-row">
                <span className="tag">
                  {field.subTags && field.subTags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleFieldExpansion(index)}
                      className="subtag-toggle"
                      aria-expanded={expandedFields.has(index)}
                      title={expandedFields.has(index) ? 'Collapse sub-tags' : 'Expand sub-tags'}
                    >
                      <span aria-hidden="true">{expandedFields.has(index) ? '▼' : '▶'}</span>
                    </button>
                  )}
                  <span className="tag-value">{field.tag}</span>
                </span>
                <span className="length">{field.length}</span>
                <span className="value">{field.value}</span>
                <span className="description">
                  {field.description}
                  {field.subTags && field.subTags.length > 0 && (
                    <span className="subtag-count">({field.subTags.length} sub-tags)</span>
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
