import React, { useState, useEffect, useRef } from 'react';
import { 
  generateMiniQR, 
  validateMiniQRInput, 
  MiniQRInput, 
  MiniQRResult 
} from '../utils/miniQRGenerator';
import { toast } from 'sonner';
import QRPreview from './generator/QRPreview';
import { ErrorMessages } from './shared';
import { DocumentIcon, QRCodeIcon } from './icons';

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

      toast.success('Mini QR code generated successfully');
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
  const isPreview = !generatedMiniQR && !!previewResult;
  const canExport = !!generatedMiniQR;

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
    if (!qrResult) return;
    const link = document.createElement('a');
    link.download = 'mini-qr-code.png';
    link.href = qrResult.qrCodeDataURL;
    link.click();
  };

  const handleCopyQRString = async () => {
    if (!qrResult) return;
    try {
      await navigator.clipboard.writeText(qrResult.qrString);
      toast.success('QR string copied to clipboard');
    } catch (error) {
      console.error('Failed to copy QR string:', error);
    }
  };

  return (
    <div className="generator-main">
      {/* Left Side - Form */}
      <div className="generator-form-modern">
        <div className="form-content">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-strong)' }}>Required Information</h3>
          
          <div className="form-sections">
            <div className="form-field">
              <label htmlFor="bankCode">
                <span className="field-label">Bank Code</span>
                <span className="field-required">*</span>
              </label>
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

            <div className="form-field">
              <label htmlFor="transactionId">
                <span className="field-label">Transaction ID</span>
                <span className="field-required">*</span>
              </label>
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

            <div className="form-field">
              <label htmlFor="countryCode">
                <span className="field-label">Country Code</span>
                <span className="field-optional">(Optional)</span>
              </label>
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
          </div>

          {/* Error Messages */}
          <ErrorMessages errors={errors} />

          {/* Actions */}
          <div className="form-actions-modern">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary"
            >
              {isGenerating ? (
                <>
                  <div className="spinner"></div>
                  Generating...
                </>
              ) : (
                <>
                  <QRCodeIcon width={18} height={18} />
                  Generate Mini QR
                </>
              )}
            </button>

            <div className="action-secondary">
              <button onClick={handleLoadSample} className="btn-secondary">
                <DocumentIcon width={16} height={16} />
                Load Sample
              </button>
              <button onClick={handleClear} className="btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                </svg>
                Clear Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Preview */}
      <QRPreview
        result={qrResult}
        isPreview={isPreview}
        isGenerating={isGeneratingPreview}
        isMiniQR={true}
        miniQRData={{
          bankCode: miniQRData.bankCode,
          transactionId: miniQRData.transactionId
        }}
        onDownload={handleDownload}
        onCopy={handleCopyQRString}
        canExport={canExport}
      />
    </div>
  );
};

export default MiniQRGenerator;
