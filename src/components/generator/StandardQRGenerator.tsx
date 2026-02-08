import React, { useState, useEffect, useCallback } from 'react';
import {
  generateThaiQR,
  validateQRInput,
  generateSampleQR,
  generateSampleCreditTransferQR,
  ThaiQRGeneratorInput,
  QRGenerationResult,
  PaymentType
} from '../../utils/thaiQRGenerator';
import { useDebouncedPreview } from '../../hooks/useDebouncedPreview';
import { useQRGeneratorState } from '../../hooks/useQRGeneratorState';
import CreditTransferFields from './CreditTransferFields';
import BillPaymentFields from './BillPaymentFields';
import CommonFields from './CommonFields';
import QRPreview from './QRPreview';
import { ErrorMessages } from '../shared';
import { DocumentIcon, QRCodeIcon, TrashIcon } from '../icons';

interface StandardQRGeneratorProps {
  paymentType: PaymentType;
  onQRGenerated?: (qrData: string) => void;
}

const StandardQRGenerator: React.FC<StandardQRGeneratorProps> = ({
  paymentType,
  onQRGenerated
}) => {
  const [formData, setFormData] = useState<ThaiQRGeneratorInput>({
    paymentType,
    aid: '',
    recipientType: 'mobile',
    recipientId: '',
    ota: '',
    billerId: '',
    reference1: '',
    reference2: '',
    amount: undefined,
    merchantName: '',
    merchantCity: ''
  });

  const state = useQRGeneratorState<QRGenerationResult>();

  const generatePreview = useCallback(() => generateThaiQR(formData), [formData]);

  let hasRequiredFields = false;
  if (formData.paymentType === 'credit-transfer') {
    hasRequiredFields = !!(formData.aid && formData.recipientId && formData.recipientType);
  } else if (formData.paymentType === 'bill-payment') {
    hasRequiredFields = !!(formData.aid && formData.billerId && formData.reference1);
  }

  const { previewResult, isGeneratingPreview } = useDebouncedPreview<QRGenerationResult>({
    hasRequiredFields,
    generateFn: generatePreview,
  });

  useEffect(() => {
    state.setPreviewResult(previewResult);
  }, [previewResult]);

  // Update form data when payment type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      paymentType,
      aid: '',
      recipientId: '',
      ota: '',
      billerId: '',
      reference1: '',
      reference2: ''
    }));
    state.clearResult();
  }, [paymentType]);

  const handleInputChange = (field: keyof ThaiQRGeneratorInput, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (state.errors.length > 0) {
      state.clearErrors();
    }
  };

  const handleGenerate = () => {
    state.handleGenerate(
      () => validateQRInput(formData),
      () => generateThaiQR(formData),
      onQRGenerated ? (result) => onQRGenerated(result.qrString) : undefined
    );
  };

  const handleLoadSample = () => {
    if (formData.paymentType === 'credit-transfer') {
      const sample = generateSampleCreditTransferQR();
      setFormData(prev => ({
        ...prev,
        aid: sample.aid,
        recipientType: sample.recipientType,
        recipientId: sample.recipientId,
        ota: sample.ota || ''
      }));
    } else {
      const sample = generateSampleQR();
      setFormData(prev => ({
        ...prev,
        aid: sample.aid,
        billerId: sample.billerId,
        reference1: sample.reference1,
        reference2: sample.reference2 || '',
        amount: sample.amount,
        merchantName: sample.merchantName || '',
        merchantCity: sample.merchantCity || ''
      }));
    }
    state.clearResult();
  };

  const handleClear = () => {
    setFormData({
      paymentType: formData.paymentType,
      aid: '',
      recipientType: 'mobile',
      recipientId: '',
      ota: '',
      billerId: '',
      reference1: '',
      reference2: '',
      amount: undefined,
      merchantName: '',
      merchantCity: ''
    });
    state.clearResult();
  };

  return (
    <div className="generator-main">
      {/* Left Side - Form */}
      <div className="generator-form-modern">
        {/* Form Content */}
        <div className="form-content">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-strong)' }}>Required Information</h3>
          <div className="form-sections">
            {/* AID Selection */}
            <div className="form-field">
              <label htmlFor="aid">
                <span className="field-label">AID (Application Identifier)</span>
                <span className="field-required">*</span>
              </label>
              <select
                id="aid"
                value={formData.aid}
                onChange={(e) => handleInputChange('aid', e.target.value)}
                className="form-select"
              >
                <option value="">Select AID Type</option>
                {formData.paymentType === 'credit-transfer' ? (
                  <>
                    <option value="A000000677010111">A000000677010111 - Merchant-Presented QR</option>
                    <option value="A000000677010114">A000000677010114 - Customer-Presented QR</option>
                  </>
                ) : (
                  <>
                    <option value="A000000677010112">A000000677010112 - Domestic Merchant</option>
                    <option value="A000000677012006">A000000677012006 - Cross-Border Merchant</option>
                  </>
                )}
              </select>
              <span className="field-hint">
                {formData.paymentType === 'credit-transfer'
                  ? 'Merchant-presented or customer-presented QR type'
                  : 'Domestic or cross-border merchant type'}
              </span>
            </div>

            {/* Dynamic Fields based on Payment Type */}
            {formData.paymentType === 'credit-transfer' ? (
              <CreditTransferFields
                recipientType={formData.recipientType || 'mobile'}
                recipientId={formData.recipientId || ''}
                ota={formData.ota || ''}
                aid={formData.aid}
                onRecipientTypeChange={(type) => handleInputChange('recipientType', type)}
                onRecipientIdChange={(id) => handleInputChange('recipientId', id)}
                onOtaChange={(ota) => handleInputChange('ota', ota)}
              />
            ) : (
              <BillPaymentFields
                billerId={formData.billerId || ''}
                reference1={formData.reference1 || ''}
                reference2={formData.reference2 || ''}
                onBillerIdChange={(id) => handleInputChange('billerId', id)}
                onReference1Change={(ref) => handleInputChange('reference1', ref)}
                onReference2Change={(ref) => handleInputChange('reference2', ref)}
              />
            )}

            {/* Optional Fields for Bill Payment */}
            {formData.paymentType === 'bill-payment' && (
              <CommonFields
                amount={formData.amount}
                merchantName={formData.merchantName || ''}
                merchantCity={formData.merchantCity || ''}
                onAmountChange={(amount) => handleInputChange('amount', amount)}
                onMerchantNameChange={(name) => handleInputChange('merchantName', name)}
                onMerchantCityChange={(city) => handleInputChange('merchantCity', city)}
                showOptionalHeading={true}
              />
            )}
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
                  Generate QR Code
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
        isMiniQR={false}
        standardQRData={{
          paymentType: formData.paymentType,
          amount: formData.amount
        }}
      />
    </div>
  );
};

export default StandardQRGenerator;
