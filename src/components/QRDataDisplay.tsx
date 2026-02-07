import React, { useState } from 'react';
import { ThaiQRData, QRSubTag, QRField } from '../utils/thaiQRParser';
import { formatCurrencyDisplay } from '../utils/currencyMapping';
import { useClipboard } from '../hooks/useClipboard';

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
  const { copy } = useClipboard();

  const toggleFieldExpansion = (index: number) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFields(newExpanded);
  };

  const formatFieldValue = (field: QRField): string => {
    // Format Transaction Currency (tag 53) with flag and country
    if (field.tag === '53') {
      return formatCurrencyDisplay(field.value);
    }

    return field.value;
  };

  const formatSubTagValue = (subTag: QRSubTag): string => {
    // Format Transaction Currency sub-tag (tag 04 with "Currency" in description)
    if (subTag.tag === '04' && subTag.description.toLowerCase().includes('currency')) {
      return formatCurrencyDisplay(subTag.value);
    }

    return subTag.value;
  };

  const getTagColorClass = (tag: string): string => {
    // Payment-related tags
    if (['29', '30', '54', '55', '56'].includes(tag)) {
      return 'tag--payment';
    }
    // Metadata tags
    if (['00', '01', '52', '53', '58', '59', '60', '61'].includes(tag)) {
      return 'tag--metadata';
    }
    // CRC/Security
    if (tag === '63') {
      return 'tag--crc';
    }
    return '';
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
          <span className="subtag-cell subtag-cell--value">{formatSubTagValue(subTag)}</span>
          <span className="subtag-cell subtag-cell--description">{subTag.description}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="qr-data-display">
      <div className="data-header">
        <div className="summary-panel">
          {data.merchantName && (
            <div className="summary-item summary-item--primary">
              <span className="summary-label">Merchant</span>
              <span className="summary-value">{data.merchantName}</span>
            </div>
          )}
          {data.amount !== undefined && (
            <div className="summary-item summary-item--highlight">
              <span className="summary-label">Amount</span>
              <span className="summary-value summary-value--amount">
                ฿{data.amount.toLocaleString()}
              </span>
            </div>
          )}
          {data.merchantId && (
            <div className="summary-item">
              <span className="summary-label">ID</span>
              <span className="summary-value summary-value--mono">{data.merchantId}</span>
              <button 
                className="copy-btn"
                onClick={() => copy(data.merchantId || '', 'Merchant ID copied')}
                title="Copy ID"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          )}
          {data.reference && (
            <div className="summary-item">
              <span className="summary-label">Reference</span>
              <span className="summary-value summary-value--mono">{data.reference}</span>
              <button 
                className="copy-btn"
                onClick={() => copy(data.reference || '', 'Reference copied')}
                title="Copy reference"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <button onClick={onClear} className="clear-button">
          <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0 1 -2,2H7a2,2 0 0 1 -2,-2V6m3,0V4a2,2 0 0 1 2,-2h4a2,2 0 0 1 2,2v2"></path>
          </svg>
          Clear
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
                <span className={`tag ${getTagColorClass(field.tag)}`}>
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
                <span className="value value--with-copy">
                  {formatFieldValue(field)}
                  <button 
                    className="field-copy-btn"
                    onClick={() => copy(field.value, `Tag ${field.tag} copied`)}
                    title="Copy value"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </span>
                <span className="description">{field.description}</span>
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
