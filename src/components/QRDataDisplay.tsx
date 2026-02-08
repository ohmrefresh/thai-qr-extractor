import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ThaiQRData, QRSubTag, QRField } from '../utils/thaiQRParser';
import { formatCurrencyDisplay } from '../utils/currencyMapping';
import { useClipboard } from '../hooks/useClipboard';
import { CopyIcon, TrashIcon, CodeIcon, CurrencyIcon } from './icons';

interface QRDataDisplayProps {
  data: ThaiQRData;
  onClear: () => void;
}

const QRDataDisplay: React.FC<QRDataDisplayProps> = ({ data, onClear }) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  
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

  // Generate QR code image from raw data
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(data.rawData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrImageUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    generateQR();
  }, [data.rawData]);

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
    if (field.tag === '53') {
      return formatCurrencyDisplay(field.value);
    }
    return field.value;
  };

  const formatSubTagValue = (subTag: QRSubTag): string => {
    if (subTag.tag === '04' && subTag.description.toLowerCase().includes('currency')) {
      return formatCurrencyDisplay(subTag.value);
    }
    return subTag.value;
  };

  const getTagColorClass = (tag: string): string => {
    if (['29', '30', '54', '55', '56'].includes(tag)) {
      return 'tag--payment';
    }
    if (['00', '01', '52', '53', '58', '59', '60', '61'].includes(tag)) {
      return 'tag--metadata';
    }
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
                <CopyIcon width={14} height={14} />
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
                <CopyIcon width={14} height={14} />
              </button>
            </div>
          )}
        </div>
        
        <button onClick={onClear} className="clear-button">
          <TrashIcon width={18} height={18} className="icon" />
          Clear
        </button>
      </div>

     

      <div className="raw-data-section">
        <h3 className="section-title">
          <CodeIcon width={22} height={22} className="icon" />
          Raw QR Data
        </h3>
        <div className="raw-data">
          <code>{data.rawData}</code>
        </div>
      </div>

      <div className="parsed-fields-section">
        <h3 className="section-title">
          <CurrencyIcon width={22} height={22} className="icon" />
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
                    <CopyIcon width={12} height={12} />
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
       {/* QR Code Image Section */}
      {qrImageUrl && (
        <div className="qr-image-section">
          <div className="qr-image-container">
            <img src={qrImageUrl} alt="QR Code" className="qr-code-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default QRDataDisplay;
