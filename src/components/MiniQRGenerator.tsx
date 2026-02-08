import React, { useState, useEffect, useCallback } from 'react';
import {
  generateMiniQR,
  validateMiniQRInput,
  MiniQRInput,
  MiniQRResult
} from '../utils/miniQRGenerator';
import { useDebouncedPreview } from '../hooks/useDebouncedPreview';
import { useQRGeneratorState } from '../hooks/useQRGeneratorState';
import QRPreview from './generator/QRPreview';
import { ErrorMessages } from './shared';
import { DocumentIcon, QRCodeIcon, TrashIcon } from './icons';

interface MiniQRGeneratorProps {
  onQRGenerated?: (qrData: string) => void;
}

const MiniQRGenerator: React.FC<MiniQRGeneratorProps> = ({ onQRGenerated }) => {
  const [miniQRData, setMiniQRData] = useState<MiniQRInput>({
    bankCode: '',
    transactionId: '',
    countryCode: 'TH'
  });

  const state = useQRGeneratorState<MiniQRResult>();

  const generatePreview = useCallback(() => generateMiniQR(miniQRData), [miniQRData]);

  const hasRequiredFields = !!(miniQRData.bankCode && miniQRData.transactionId);

  const { previewResult, isGeneratingPreview } = useDebouncedPreview<MiniQRResult>({
    hasRequiredFields,
    generateFn: generatePreview,
  });

  useEffect(() => {
    state.setPreviewResult(previewResult);
  }, [previewResult]);

  const handleInputChange = (field: keyof MiniQRInput, value: string) => {
    setMiniQRData(prev => ({ ...prev, [field]: value }));
    if (state.errors.length > 0) {
      state.clearErrors();
    }
  };

  const handleGenerate = () => {
    state.handleGenerate(
      () => validateMiniQRInput(miniQRData),
      () => generateMiniQR(miniQRData),
      onQRGenerated ? (result) => onQRGenerated(result.qrString) : undefined
    );
  };

  const handleLoadSample = () => {
    setMiniQRData({
      bankCode: '014',
      transactionId: '202602078Buvov9xGKBPqxhso',
      countryCode: 'TH'
    });
    state.clearResult();
  };

  const handleClear = () => {
    setMiniQRData({
      bankCode: '',
      transactionId: '',
      countryCode: 'TH'
    });
    state.clearResult();
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
          <ErrorMessages errors={state.errors} />

          {/* Actions */}
          <div className="form-actions-modern">
            <button
              onClick={handleGenerate}
              disabled={state.isGenerating}
              className="btn-primary"
            >
              {state.isGenerating ? (
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
                <TrashIcon width={16} height={16} />
                Clear Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Preview */}
      <QRPreview
        result={state.qrResult}
        isPreview={state.isPreview}
        isGenerating={isGeneratingPreview}
        isMiniQR={true}
        miniQRData={{
          bankCode: miniQRData.bankCode,
          transactionId: miniQRData.transactionId
        }}
      />
    </div>
  );
};

export default MiniQRGenerator;
