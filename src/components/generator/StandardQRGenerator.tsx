import React, { useState, useEffect, useRef } from 'react';
import {
  generateThaiQR,
  validateQRInput,
  generateSampleQR,
  generateSampleCreditTransferQR,
  ThaiQRGeneratorInput,
  QRGenerationResult,
  PaymentType
} from '../../utils/thaiQRGenerator';
import { toast } from 'sonner';
import CreditTransferFields from './CreditTransferFields';
import BillPaymentFields from './BillPaymentFields';
import CommonFields from './CommonFields';
import QRPreview from './QRPreview';
import { ErrorMessages } from '../shared';
import { DocumentIcon, QRCodeIcon } from '../icons';

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

  const [result, setResult] = useState<QRGenerationResult | null>(null);
  const [previewResult, setPreviewResult] = useState<QRGenerationResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    setResult(null);
    setPreviewResult(null);
    setErrors([]);
  }, [paymentType]);

  // Live preview generation
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    let hasRequiredFields = false;
    if (formData.paymentType === 'credit-transfer') {
      hasRequiredFields = !!(formData.aid && formData.recipientId && formData.recipientType);
    } else if (formData.paymentType === 'bill-payment') {
      hasRequiredFields = !!(formData.aid && formData.billerId && formData.reference1);
    }

    if (!hasRequiredFields) {
      setPreviewResult(null);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsGeneratingPreview(true);

      try {
        const qrResult = await generateThaiQR(formData);
        setPreviewResult(qrResult);
      } catch (error) {
        setPreviewResult(null);
      } finally {
        setIsGeneratingPreview(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData]);

  const handleInputChange = (field: keyof ThaiQRGeneratorInput, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleGenerate = async () => {
    const validationErrors = validateQRInput(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsGenerating(true);
      setErrors([]);

      const qrResult = await generateThaiQR(formData);
      setResult(qrResult);

      toast.success('QR code generated successfully');

      if (onQRGenerated) {
        onQRGenerated(qrResult.qrString);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to generate QR code']);
    } finally {
      setIsGenerating(false);
    }
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
    setResult(null);
    setPreviewResult(null);
    setErrors([]);
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
    setResult(null);
    setPreviewResult(null);
    setErrors([]);
  };

  const handleDownload = () => {
    const qrResult = result || previewResult;
    if (!qrResult) return;
    const link = document.createElement('a');
    link.download = 'thai-qr-code.png';
    link.href = qrResult.qrCodeDataURL;
    link.click();
  };

  const handleCopyQRString = async () => {
    const qrResult = result || previewResult;
    if (!qrResult) return;
    try {
      await navigator.clipboard.writeText(qrResult.qrString);
      toast.success('QR string copied to clipboard');
    } catch (error) {
      console.error('Failed to copy QR string:', error);
    }
  };

  const qrResult = result || previewResult;
  const isPreview = !result && !!previewResult;
  const canExport = !!result;

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
        isMiniQR={false}
        standardQRData={{
          paymentType: formData.paymentType,
          amount: formData.amount
        }}
        onDownload={handleDownload}
        onCopy={handleCopyQRString}
        canExport={canExport}
      />
    </div>
  );
};

export default StandardQRGenerator;
