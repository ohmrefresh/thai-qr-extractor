import React, { useState, useEffect, useRef } from 'react';
import { 
  generateMiniQR, 
  validateMiniQRInput, 
  MiniQRInput, 
  MiniQRResult 
} from '../utils/miniQRGenerator';
import { toast } from 'sonner';

interface MiniQRGeneratorProps {
  onQRGenerated?: (qrData: string) => void;
}

const MiniQRGenerator: React.FC<MiniQRGeneratorProps> = ({ onQRGenerated }) => {
  const [miniQRData, setMiniQRData] = useState<MiniQRInput>({
    bankCode: '',
    transactionId: '',
    countryCode: 'TH'
  });
  const [generatedMiniQR, setGeneratedMiniQR] = useState<MiniQRResult | null>(null);
  const [previewResult, setPreviewResult] = useState<MiniQRResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (field: keyof MiniQRInput, value: string) => {
    setMiniQRData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Live preview generation with debouncing
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if we have the minimum required fields for preview
    const hasRequiredFields = !!(miniQRData.bankCode && miniQRData.transactionId);

    if (!hasRequiredFields) {
      setPreviewResult(null);
      return;
    }

    // Debounce the preview generation
    debounceTimerRef.current = setTimeout(async () => {
      setIsGeneratingPreview(true);

      try {
        const qrResult = await generateMiniQR(miniQRData);
        setPreviewResult(qrResult);
      } catch (error) {
        // Silently fail for preview - user can still click Generate for full validation
        setPreviewResult(null);
      } finally {
        setIsGeneratingPreview(false);
      }
    }, 500); // 500ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [miniQRData]);

  const handleGenerate = async () => {
    const validationErrors = validateMiniQRInput(miniQRData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsGenerating(true);
      setErrors([]);
      const result = await generateMiniQR(miniQRData);
      setGeneratedMiniQR(result);

      toast.success('Mini QR code generated');
      if (onQRGenerated) {
        onQRGenerated(result.qrString);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to generate QR code']);
    } finally {
      setIsGenerating(false);
    }
  };

  // Use preview result if no finalized result yet
  const qrResult = generatedMiniQR || previewResult;
  const hasRequiredFields = !!(miniQRData.bankCode && miniQRData.transactionId);

  const handleLoadSample = () => {
    setMiniQRData({
      bankCode: '014',
      transactionId: '202602078Buvov9xGKBPqxhso',
      countryCode: 'TH'
    });
    setGeneratedMiniQR(null);
    setErrors([]);
  };

  const handleClear = () => {
    setMiniQRData({
      bankCode: '',
      transactionId: '',
      countryCode: 'TH'
    });
    setGeneratedMiniQR(null);
    setErrors([]);
  };

  const handleDownload = () => {
    if (!generatedMiniQR) return;

    const link = document.createElement('a');
    link.download = 'mini-qr-code.png';
    link.href = generatedMiniQR.qrCodeDataURL;
    link.click();
  };

  const handleCopyQRString = async () => {
    if (!generatedMiniQR) return;

    try {
      await navigator.clipboard.writeText(generatedMiniQR.qrString);
      toast.success('QR string copied to clipboard');
    } catch (error) {
      console.error('Failed to copy QR string:', error);
    }
  };

  return (
    <div className="mini-qr-generator">
      <div className="generator-header">
        <div className="card-icon accent-generate">
          <svg className="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <div>
          <h2>Mini QR Generator</h2>
          <p>Generate compact Mini QR codes for Thai bank transactions</p>
        </div>
      </div>

      <div className="generator-content">
        <div className="generator-form">
          <div className="form-section">
            <div className="info-box" style={{ marginBottom: '1rem' }}>
              <strong>Mini QR Format</strong>
              <p>Compact QR format for bank transactions with bank code and transaction ID.</p>
            </div>

            <div className="form-group">
              <label htmlFor="bankCode">Bank Code (3 digits) *</label>
              <input
                id="bankCode"
                type="text"
                className="form-input"
                value={miniQRData.bankCode}
                onChange={(e) => handleInputChange('bankCode', e.target.value)}
                placeholder="e.g., 014"
                maxLength={3}
              />
              <span className="field-hint">3-digit bank code (e.g., 014 for SCB)</span>
            </div>

            <div className="form-group">
              <label htmlFor="transactionId">Transaction ID (max 50 chars) *</label>
              <input
                id="transactionId"
                type="text"
                className="form-input"
                value={miniQRData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                placeholder="e.g., 202602078Buvov9xGKBPqxhso"
                maxLength={50}
              />
              <span className="field-hint">Unique transaction identifier (max 50 characters)</span>
            </div>

            <div className="form-group">
              <label htmlFor="countryCode">Country Code</label>
              <input
                id="countryCode"
                type="text"
                className="form-input"
                value={miniQRData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                placeholder="TH"
                maxLength={2}
              />
              <span className="field-hint">Country code (default: TH)</span>
            </div>

            {errors.length > 0 && (
              <div className="error-messages">
                {errors.map((error, index) => (
                  <div key={index} className="error-message">
                    {error}
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="generate-button"
              >
                <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                {isGenerating ? 'Generating...' : 'Generate Mini QR'}
              </button>

              <button onClick={handleLoadSample} className="sample-button">
                <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                Load Sample
              </button>

              <button onClick={handleClear} className="clear-button">
                <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                </svg>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="qr-result">
          <h3>QR Code Preview</h3>

          {qrResult ? (
            <>
              <div className="qr-display">
                <img
                  src={qrResult.qrCodeDataURL}
                  alt="Generated Mini QR Code"
                  className="qr-image"
                />

                {!generatedMiniQR && previewResult && (
                  <div className="preview-badge">
                    <span>Live Preview</span>
                  </div>
                )}

                <div className="qr-actions">
                  <button onClick={handleDownload} className="download-button" disabled={!hasRequiredFields}>
                    <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PNG
                  </button>

                  <button onClick={handleCopyQRString} className="copy-button" disabled={!hasRequiredFields}>
                    <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy QR String
                  </button>
                </div>
              </div>

              <div className="qr-string">
                <h4>Mini QR Code String:</h4>
                <div className="qr-string-display">
                  <code>{qrResult.qrString}</code>
                </div>
              </div>

              <div className="mini-qr-result">
                <h4>Transaction Details:</h4>
                <div className="mini-qr-details">
                  <div className="mini-qr-detail-item">
                    <label>Bank Code</label>
                    <span>{qrResult.bankCode}</span>
                  </div>
                  <div className="mini-qr-detail-item">
                    <label>Transaction ID</label>
                    <span>{qrResult.transactionId}</span>
                  </div>
                  <div className="mini-qr-detail-item">
                    <label>Checksum (CRC)</label>
                    <span>{qrResult.checksum}</span>
                  </div>
                </div>
              </div>

              {!generatedMiniQR && previewResult && (
                <p className="preview-hint">
                  <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"></path>
                    <path d="M12,17h.01"></path>
                  </svg>
                  This is a live preview. You can download or copy the QR code directly, or click "Generate Mini QR" to finalize
                </p>
              )}
            </>
          ) : (
            <div className="qr-placeholder">
              <svg className="icon" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <p>Fill in the required fields to see a live preview</p>
              {isGeneratingPreview && (
                <div className="generating-spinner">
                  <div className="spinner"></div>
                  <span>Generating preview...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniQRGenerator;
