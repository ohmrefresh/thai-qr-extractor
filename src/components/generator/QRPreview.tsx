import React, { useState, useCallback } from 'react';
import { QRGenerationResult } from '../../utils/thaiQRGenerator';
import { MiniQRResult } from '../../utils/miniQRGenerator';
import { QRCodeIcon } from '../icons';
import { toast } from 'sonner';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Handle download QR code image - works in both preview and generated mode
  const handleDownload = useCallback(async () => {
    if (!result?.qrCodeDataURL) {
      toast.error('No QR code available to download');
      return;
    }

    setIsDownloading(true);
    
    try {
      // Create a temporary link element
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

  // Handle copy QR string
  const handleCopy = useCallback(async () => {
    if (!result?.qrString) {
      toast.error('No QR string available to copy');
      return;
    }

    setIsCopying(true);
    
    try {
      await navigator.clipboard.writeText(result.qrString);
      toast.success('QR string copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = result.qrString;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast.success('QR string copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy QR string');
      } finally {
        document.body.removeChild(textArea);
      }
    } finally {
      setIsCopying(false);
    }
  }, [result]);

  // Get filename based on QR type
  const getFileName = () => {
    if (isMiniQR) return 'mini-qr-code';
    if (standardQRData?.paymentType === 'credit-transfer') return 'credit-transfer-qr';
    return 'bill-payment-qr';
  };

  return (
    <div className="generator-preview-modern">
      <div className="preview-header">
        <h3>QR Code Preview</h3>
        {isPreview && (
          <span className="preview-badge-modern">Live Preview</span>
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

            {/* Enhanced Action Buttons */}
            <div className="preview-actions">
              <button
                onClick={handleDownload}
                className="btn-action btn-action-primary"
                disabled={isDownloading}
                title="Download QR code as PNG"
              >
                {isDownloading ? (
                  <>
                    <div className="spinner-small" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PNG
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                className="btn-action btn-action-secondary"
                disabled={isCopying}
                title="Copy QR string to clipboard"
              >
                {isCopying ? (
                  <>
                    <div className="spinner-small" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                    Copying...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy String
                  </>
                )}
              </button>
            </div>

            {isPreview && (
              <p className="preview-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                This is a live preview. Both download and copy are available.
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
