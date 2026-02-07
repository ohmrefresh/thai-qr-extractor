import React, { useState, useEffect, useRef } from 'react';
import {
  generateThaiQR,
  validateQRInput,
  generateSampleQR,
  generateSampleCreditTransferQR,
  ThaiQRGeneratorInput,
  QRGenerationResult,
  PaymentType,
  RecipientType
} from '../utils/thaiQRGenerator';
import { toast } from 'sonner';

interface QRGeneratorProps {
  onQRGenerated?: (qrData: string) => void;
  onClose?: () => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ onQRGenerated, onClose }) => {
  const [formData, setFormData] = useState<ThaiQRGeneratorInput>({
    paymentType: 'bill-payment',
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
  const [activeSection, setActiveSection] = useState<'required' | 'optional'>('required');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (field: keyof ThaiQRGeneratorInput, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handlePaymentTypeChange = (type: PaymentType) => {
    setFormData(prev => ({
      ...prev,
      paymentType: type,
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
  };

  // Live preview generation with debouncing
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

  const hasRequiredFields = () => {
    if (formData.paymentType === 'credit-transfer') {
      return !!(formData.aid && formData.recipientId && formData.recipientType);
    } else if (formData.paymentType === 'bill-payment') {
      return !!(formData.aid && formData.billerId && formData.reference1);
    }
    return false;
  };

  const canExport = (result || previewResult) && hasRequiredFields();
  const qrResult = result || previewResult;
  const isPreview = !result && previewResult;

  return (
    <div className="qr-generator-modern">
      {/* Header */}
      <div className="generator-header-modern">
        <div className="header-title">
          <div className="card-icon accent-generate">
            <svg className="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div>
            <h2>QR Code Generator</h2>
            <p>Create Thai PromptPay QR codes for payments</p>
          </div>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close generator">
            <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Payment Type Info */}
      <div className="payment-type-info" style={{ marginBottom: '1.5rem' }}>
        {formData.paymentType === 'credit-transfer' ? (
          <div className="info-box">
            <strong>Tag 29 - PromptPay Credit Transfer</strong>
            <p>Used for credit transfer transactions with PromptPay ID (mobile number, national ID, e-wallet ID, or bank account).</p>
          </div>
        ) : (
          <div className="info-box">
            <strong>Tag 30 - PromptPay Bill Payment</strong>
            <p>Used for bill payment transactions with biller ID and reference numbers for domestic or cross-border merchants.</p>
          </div>
        )}
      </div>

      {/* Payment Type Selector */}
      <div className="payment-type-tabs">
        <button
          type="button"
          className={`payment-tab ${formData.paymentType === 'credit-transfer' ? 'active' : ''}`}
          onClick={() => handlePaymentTypeChange('credit-transfer')}
        >
          <div className="tab-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
              <path d="M7 19h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z"></path>
            </svg>
          </div>
          <div className="tab-content">
            <strong>Credit Transfer</strong>
            <span>Tag 29 - PromptPay ID</span>
          </div>
        </button>
        <button
          type="button"
          className={`payment-tab ${formData.paymentType === 'bill-payment' ? 'active' : ''}`}
          onClick={() => handlePaymentTypeChange('bill-payment')}
        >
          <div className="tab-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <div className="tab-content">
            <strong>Bill Payment</strong>
            <span>Tag 30 - Biller & References</span>
          </div>
        </button>
      </div>

      {/* Main Content */}
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
                  <div className="dynamic-fields">
                    <div className="form-field">
                      <label htmlFor="recipientType">
                        <span className="field-label">Recipient Type</span>
                        <span className="field-required">*</span>
                      </label>
                      <select
                        id="recipientType"
                        value={formData.recipientType || 'mobile'}
                        onChange={(e) => handleInputChange('recipientType', e.target.value as RecipientType)}
                        className="form-select"
                      >
                        <option value="mobile">Mobile Number</option>
                        <option value="national-id">National ID / Tax ID</option>
                        <option value="ewallet">E-Wallet ID</option>
                        <option value="bank-account">Bank Account</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="recipientId">
                        <span className="field-label">
                          {formData.recipientType === 'mobile' ? 'Mobile Number' : 'Recipient ID'}
                        </span>
                        <span className="field-required">*</span>
                      </label>
                      <input
                        id="recipientId"
                        type="text"
                        value={formData.recipientId || ''}
                        onChange={(e) => handleInputChange('recipientId', e.target.value)}
                        placeholder={
                          formData.recipientType === 'mobile' ? '0XXXXXXXXX' :
                          formData.recipientType === 'national-id' ? '1-1111-11111-11-1' :
                          formData.recipientType === 'ewallet' ? 'E-Wallet ID' :
                          'Bank Account'
                        }
                        maxLength={43}
                        className="form-input"
                      />
                      <span className="field-hint">
                        {formData.recipientType === 'mobile' && 'Auto-normalizes to 0066 format'}
                        {formData.recipientType === 'national-id' && '13-digit National or Tax ID'}
                        {formData.recipientType === 'ewallet' && '15-digit E-Wallet identifier'}
                        {formData.recipientType === 'bank-account' && 'Up to 43 characters'}
                      </span>
                    </div>

                    {formData.aid === 'A000000677010114' && (
                      <div className="form-field">
                        <label htmlFor="ota">
                          <span className="field-label">OTA (One-Time Authorization)</span>
                          <span className="field-required">*</span>
                        </label>
                        <input
                          id="ota"
                          type="text"
                          value={formData.ota || ''}
                          onChange={(e) => handleInputChange('ota', e.target.value)}
                          placeholder="10-digit code"
                          maxLength={10}
                          className="form-input"
                        />
                        <span className="field-hint">Required for customer-presented QR</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="dynamic-fields">
                    <div className="form-field">
                      <label htmlFor="billerId">
                        <span className="field-label">Biller ID</span>
                        <span className="field-required">*</span>
                      </label>
                      <input
                        id="billerId"
                        type="text"
                        value={formData.billerId || ''}
                        onChange={(e) => handleInputChange('billerId', e.target.value)}
                        placeholder="010555500012345"
                        maxLength={32}
                        className="form-input"
                      />
                      <span className="field-hint">National ID/Tax ID with suffix (15 digits)</span>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="reference1">
                          <span className="field-label">Reference 1</span>
                          <span className="field-required">*</span>
                        </label>
                        <input
                          id="reference1"
                          type="text"
                          value={formData.reference1 || ''}
                          onChange={(e) => handleInputChange('reference1', e.target.value)}
                          placeholder="INV2024001"
                          maxLength={20}
                          className="form-input"
                        />
                        <span className="field-hint">Primary reference number</span>
                      </div>

                      <div className="form-field">
                        <label htmlFor="reference2">
                          <span className="field-label">Reference 2</span>
                          <span className="field-optional">(Optional)</span>
                        </label>
                        <input
                          id="reference2"
                          type="text"
                          value={formData.reference2 || ''}
                          onChange={(e) => handleInputChange('reference2', e.target.value)}
                          placeholder="Customer ID"
                          maxLength={20}
                          className="form-input"
                        />
                        <span className="field-hint">Secondary reference</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Fields for Bill Payment */}
                {formData.paymentType === 'bill-payment' && (
                  <div className="optional-section">
                    <div className="section-divider" />
                    <h4 className="optional-heading">Optional Information</h4>

                    <div className="form-field">
                      <label htmlFor="amount">Amount (THB)</label>
                      <div className="input-with-prefix">
                        <span className="input-prefix">฿</span>
                        <input
                          id="amount"
                          type="number"
                          value={formData.amount || ''}
                          onChange={(e) => handleInputChange('amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                          min="0"
                          max="999999.99"
                          step="0.01"
                          className="form-input"
                        />
                      </div>
                      <span className="field-hint">Amount in Thai Baht (THB)</span>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="merchantName">
                          <span className="field-label">Merchant Name</span>
                          <span className="field-optional">(Optional)</span>
                        </label>
                        <input
                          id="merchantName"
                          type="text"
                          value={formData.merchantName}
                          onChange={(e) => handleInputChange('merchantName', e.target.value)}
                          placeholder="Your Business Name"
                          maxLength={25}
                          className="form-input"
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="merchantCity">Merchant City</label>
                        <input
                          id="merchantCity"
                          type="text"
                          value={formData.merchantCity}
                          onChange={(e) => handleInputChange('merchantCity', e.target.value)}
                          placeholder="Bangkok"
                          maxLength={15}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="error-messages-modern">
                {errors.map((error, index) => (
                  <div key={index} className="error-message-modern">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12" y2="16"></line>
                    </svg>
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions-modern">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary"
            >
              {isGenerating ? (
                <>
                  <div className="spinner-small"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Generate QR Code
                </>
              )}
            </button>
            
            <div className="action-secondary">
              <button onClick={handleLoadSample} className="btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                Load Sample
              </button>
              
              <button onClick={handleClear} className="btn-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                </svg>
                Clear Form
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="generator-preview-modern">
          <div className="preview-header">
            <h3>QR Code Preview</h3>
            {isPreview && (
              <span className="preview-badge-modern">Live</span>
            )}
          </div>

          <div className="preview-content">
            {qrResult ? (
              <>
                <div className="qr-display-modern">
                  <img
                    src={qrResult.qrCodeDataURL}
                    alt="Generated Thai QR Code"
                    className="qr-image-modern"
                  />
                </div>

                <div className="qr-details">
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      {formData.paymentType === 'credit-transfer' ? 'Credit Transfer (Tag 29)' : 'Bill Payment (Tag 30)'}
                    </span>
                  </div>
                  {formData.amount && (
                    <div className="detail-row">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value highlight">฿{formData.amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="qr-string-modern">
                  <code>{qrResult.qrString}</code>
                </div>

                <div className="preview-actions">
                  <button 
                    onClick={handleDownload} 
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

                  <button 
                    onClick={handleCopyQRString} 
                    className="btn-action"
                    disabled={!canExport}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </button>
                </div>

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
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <p>Fill in the required fields to generate a preview</p>
                {isGeneratingPreview && (
                  <div className="generating-indicator">
                    <div className="spinner-small"></div>
                    <span>Generating...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
