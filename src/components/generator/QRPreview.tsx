import React from 'react';
import { QRGenerationResult } from '../../utils/thaiQRGenerator';
import { MiniQRResult } from '../../utils/miniQRGenerator';
import { QRCodeIcon } from '../icons';

interface QRPreviewProps {
  result: QRGenerationResult | MiniQRResult | null;
  isPreview?: boolean;
  isGenerating?: boolean;
  isMiniQR?: boolean;
  miniQRData?: {
    bankCode: string;
    transactionId: string;
  };
  standardQRData?: {
    paymentType: 'credit-transfer' | 'bill-payment';
    amount?: number;
  };
  onDownload?: () => void;
  onCopy?: () => void;
  canExport?: boolean;
}

const QRPreview: React.FC<QRPreviewProps> = ({
  result,
  isPreview = false,
  isGenerating = false,
  isMiniQR = false,
  miniQRData,
  standardQRData,
  onDownload,
  onCopy,
  canExport = true
}) => {
  return (
    <div className="generator-preview-modern">
      <div className="preview-header">
        <h3>QR Code Preview</h3>
        {isPreview && (
          <span className="preview-badge-modern">Live</span>
        )}
      </div>

      <div className="preview-content">
        {result ? (
          <>
            <div className="qr-display-modern">
              <img
                src={result.qrCodeDataURL}
                alt="Generated Thai QR Code"
                className="qr-image-modern"
              />
            </div>

            <div className="qr-details">
              {isMiniQR && miniQRData ? (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">Mini QR - Bank Transaction</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Bank Code:</span>
                    <span className="detail-value">{miniQRData.bankCode}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Transaction ID:</span>
                    <span className="detail-value">{miniQRData.transactionId}</span>
                  </div>
                </>
              ) : standardQRData ? (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      {standardQRData.paymentType === 'credit-transfer'
                        ? 'Credit Transfer (Tag 29)'
                        : 'Bill Payment (Tag 30)'}
                    </span>
                  </div>
                  {standardQRData.amount && (
                    <div className="detail-row">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value highlight">฿{standardQRData.amount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="qr-string-modern">
              <code>{result.qrString}</code>
            </div>

            {(onDownload || onCopy) && (
              <div className="preview-actions">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="btn-action"
                    disabled={!canExport}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
                  </button>
                )}

                {onCopy && (
                  <button
                    onClick={onCopy}
                    className="btn-action"
                    disabled={!canExport}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </button>
                )}
              </div>
            )}

            {isPreview && (
              <p className="preview-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                This is a live preview. Click "Generate" to finalize.
              </p>
            )}
          </>
        ) : (
          <div className="preview-placeholder-modern">
            <QRCodeIcon width={80} height={80} className="placeholder-icon" />
            <p>Fill in the required fields to generate a preview</p>
            {isGenerating && (
              <div className="generating-indicator">
                <div className="spinner-small"></div>
                <span>Generating...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRPreview;
