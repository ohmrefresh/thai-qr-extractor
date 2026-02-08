import React, { useState, useCallback } from 'react';
import { QRGenerationResult } from '../../utils/thaiQRGenerator';
import { MiniQRResult } from '../../utils/miniQRGenerator';
import { QRCodeIcon, DownloadIcon, CopyIcon, ChevronIcon } from '../icons';
import { toast } from 'sonner';
import { useClipboard } from '../../hooks/useClipboard';

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
}

const QRPreview: React.FC<QRPreviewProps> = ({
  result,
  isPreview = false,
  isGenerating = false,
  isMiniQR = false,
  miniQRData,
  standardQRData
}) => {
  const { copy } = useClipboard();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQRString, setShowQRString] = useState(false);

  // Handle download QR code image
  const handleDownload = useCallback(async () => {
    if (!result?.qrCodeDataURL) {
      toast.error('No QR code available to download');
      return;
    }

    setIsDownloading(true);
    
    try {
      const link = document.createElement('a');
      link.href = result.qrCodeDataURL;
      link.download = `${getFileName()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download QR code');
    } finally {
      setIsDownloading(false);
    }
  }, [result]);

  // Get filename based on QR type
  const getFileName = () => {
    if (isMiniQR) return 'mini-qr-code';
    if (standardQRData?.paymentType === 'credit-transfer') return 'credit-transfer-qr';
    return 'bill-payment-qr';
  };

  // Get QR type label
  const getQRTypeLabel = () => {
    if (isMiniQR) return 'Mini QR';
    if (standardQRData?.paymentType === 'credit-transfer') return 'Credit Transfer';
    return 'Bill Payment';
  };

  // Get QR type icon/color
  const getQRTypeTheme = () => {
    if (isMiniQR) return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
    if (standardQRData?.paymentType === 'credit-transfer') return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  };

  const theme = getQRTypeTheme();

  return (
    <div className="qr-preview-card">
      {/* Header */}
      <div className="qr-preview-header">
        <div className="qr-preview-title-group">
          <div 
            className="qr-preview-type-icon"
            style={{ background: theme.bg, color: theme.color }}
          >
            <QRCodeIcon width={20} height={20} />
          </div>
          <div>
            <h3 className="qr-preview-title">QR Code Preview</h3>
            <span className="qr-preview-subtitle">{getQRTypeLabel()}</span>
          </div>
        </div>
        {isPreview && (
          <span className="qr-preview-live-badge">
            <span className="live-dot" />
            Live
          </span>
        )}
      </div>

      {/* Content */}
      <div className="qr-preview-body">
        {result ? (
          <>
            {/* QR Image Container */}
            <div className="qr-preview-image-container">
              <div className="qr-preview-image-wrapper">
                <img
                  src={result.qrCodeDataURL}
                  alt="Generated Thai QR Code"
                  className="qr-preview-image"
                />
                {/* Decorative frame */}
                <div className="qr-preview-frame">
                  <div className="qr-frame-corner qr-frame-tl" />
                  <div className="qr-frame-corner qr-frame-tr" />
                  <div className="qr-frame-corner qr-frame-bl" />
                  <div className="qr-frame-corner qr-frame-br" />
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="qr-preview-details">
              {isMiniQR && miniQRData ? (
                <div className="qr-details-grid">
                  <div className="qr-detail-item">
                    <span className="qr-detail-label">Bank Code</span>
                    <span className="qr-detail-value">{miniQRData.bankCode}</span>
                  </div>
                  <div className="qr-detail-item qr-detail-item-full">
                    <span className="qr-detail-label">Transaction ID</span>
                    <span className="qr-detail-value qr-detail-mono">{miniQRData.transactionId}</span>
                  </div>
                </div>
              ) : standardQRData ? (
                <div className="qr-details-grid">
                  <div className="qr-detail-item">
                    <span className="qr-detail-label">Payment Type</span>
                    <span className="qr-detail-value">
                      {standardQRData.paymentType === 'credit-transfer' ? 'Credit Transfer' : 'Bill Payment'}
                    </span>
                  </div>
                  {standardQRData.amount !== undefined && (
                    <div className="qr-detail-item">
                      <span className="qr-detail-label">Amount</span>
                      <span className="qr-detail-value qr-detail-amount">
                        ฿{standardQRData.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* QR String Toggle */}
            <div className="qr-preview-string-section">
              <button 
                className="qr-string-toggle"
                onClick={() => setShowQRString(!showQRString)}
              >
                <span>QR String Data</span>
                <ChevronIcon
                  width={16}
                  height={16}
                  style={{ transform: showQRString ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                />
              </button>
              
              {showQRString && (
                <div className="qr-preview-string">
                  <code>{result.qrString}</code>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="qr-preview-actions">
              <button
                onClick={handleDownload}
                className="qr-action-btn qr-action-btn-primary"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="qr-btn-spinner" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon width={18} height={18} />
                    <span>Download PNG</span>
                  </>
                )}
              </button>

              <button
                onClick={() => copy(result?.qrString || '', 'QR string copied to clipboard')}
                className="qr-action-btn qr-action-btn-secondary"
              >
                <CopyIcon width={18} height={18} />
                <span>Copy String</span>
              </button>
            </div>
          </>
        ) : (
          <div className="qr-preview-empty">
            <div className="qr-empty-icon">
              <QRCodeIcon width={48} height={48} />
            </div>
            <p className="qr-empty-title">Ready to Generate</p>
            <p className="qr-empty-subtitle">Fill in the required fields to preview your QR code</p>
            {isGenerating && (
              <div className="qr-generating-indicator">
                <div className="qr-generating-spinner" />
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
