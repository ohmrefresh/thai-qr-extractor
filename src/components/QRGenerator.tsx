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
import { 
  generateMiniQR, 
  validateMiniQRInput, 
  MiniQRInput, 
  MiniQRResult 
} from '../utils/miniQRGenerator';
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mini QR state
  const [showMiniQR, setShowMiniQR] = useState(false);
  const [miniQRData, setMiniQRData] = useState<MiniQRInput>({
    bankCode: '',
    transactionId: '',
    countryCode: 'TH'
  });
  const [generatedMiniQR, setGeneratedMiniQR] = useState<MiniQRResult | null>(null);
  const [miniQRErrors, setMiniQRErrors] = useState<string[]>([]);
  const [isGeneratingMiniQR, setIsGeneratingMiniQR] = useState(false);

  const handleInputChange = (field: keyof ThaiQRGeneratorInput, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Mini QR handlers
  const handleMiniQRInputChange = (field: keyof MiniQRInput, value: string) => {
    setMiniQRData(prev => ({ ...prev, [field]: value }));
    if (miniQRErrors.length > 0) {
      setMiniQRErrors([]);
    }
  };

  const handleGenerateMiniQR = async () => {
    const validationErrors = validateMiniQRInput(miniQRData);
    if (validationErrors.length > 0) {
      setMiniQRErrors(validationErrors);
      return;
    }

    try {
      setIsGeneratingMiniQR(true);
      setMiniQRErrors([]);
      const result = await generateMiniQR(miniQRData);
      setGeneratedMiniQR(result);
      
      toast.success('Mini QR code generated');
      if (onQRGenerated) {
        onQRGenerated(result.qrString);
      }
    } catch (error) {
      setMiniQRErrors([error instanceof Error ? error.message : 'Failed to generate QR code']);
    } finally {
      setIsGeneratingMiniQR(false);
    }
  };

  const handleLoadMiniQRSample = () => {
    setMiniQRData({
      bankCode: '014',
      transactionId: '202602078Buvov9xGKBPqxhso',
      countryCode: 'TH'
    });
    setGeneratedMiniQR(null);
    setMiniQRErrors([]);
  };

  const handleClearMiniQR = () => {
    setMiniQRData({
      bankCode: '',
      transactionId: '',
      countryCode: 'TH'
    });
    setGeneratedMiniQR(null);
    setMiniQRErrors([]);
  };

  const handleDownloadMiniQR = () => {
    if (!generatedMiniQR) return;

    const link = document.createElement('a');
    link.download = 'mini-qr-code.png';
    link.href = generatedMiniQR.qrCodeDataURL;
    link.click();
  };

  const handleCopyMiniQRString = async () => {
    if (!generatedMiniQR) return;

    try {
      await navigator.clipboard.writeText(generatedMiniQR.qrString);
    } catch (error) {
      console.error('Failed to copy QR string:', error);
    }
  };

  // Live preview generation with debouncing
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if we have the minimum required fields for preview based on payment type
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

    // Debounce the preview generation
    debounceTimerRef.current = setTimeout(async () => {
      setIsGeneratingPreview(true);

      try {
        const qrResult = await generateThaiQR(formData);
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
  }, [formData]);

  const handleGenerate = async () => {
    const validationErrors = validateQRInput(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsGenerating(true);
    setErrors([]);
    
    try {
      const qrResult = await generateThaiQR(formData);
      setResult(qrResult);
      
      toast.success('QR code generated');
      if (onQRGenerated) {
        onQRGenerated(qrResult.qrString);
      }
    } catch (error) {
      setErrors([`Generation failed: ${error}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaymentTypeChange = (paymentType: PaymentType) => {
    setFormData(prev => ({
      ...prev,
      paymentType,
      // Reset fields when switching payment types
      aid: '',
      recipientId: '',
      ota: '',
      billerId: '',
      reference1: '',
      reference2: ''
    }));
    setResult(null);
    setErrors([]);
  };

  const handleLoadSample = () => {
    const sampleData = formData.paymentType === 'credit-transfer'
      ? generateSampleCreditTransferQR()
      : generateSampleQR();
    setFormData(sampleData);
    setResult(null);
    setErrors([]);
  };

  const handleClear = () => {
    setFormData({
      paymentType: formData.paymentType, // Keep the payment type
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
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy QR string:', error);
    }
  };

  // Check if all required fields are filled
  const hasRequiredFields = (): boolean => {
    if (formData.paymentType === 'credit-transfer') {
      const baseRequirements = !!(formData.aid && formData.recipientId && formData.recipientType);
      // Check OTA requirement for customer-presented QR
      if (formData.aid === 'A000000677010114') {
        return baseRequirements && !!formData.ota;
      }
      return baseRequirements;
    } else if (formData.paymentType === 'bill-payment') {
      return !!(formData.aid && formData.billerId && formData.reference1);
    }
    return false;
  };

  // Buttons are enabled when we have a valid preview or finalized result
  const canExport = (result || previewResult) && hasRequiredFields();

  return (
    <div className="qr-generator">
      <div className="generator-header">
        <div className="card-icon accent-generate">
          <svg className="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
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

      <div className="generator-content">
        <div className="generator-form">
          <div className="form-section">
            <h3>Payment Type</h3>
            <div className="payment-type-selector">
              <button
                type="button"
                className={`payment-type-button ${formData.paymentType === 'credit-transfer' ? 'active' : ''}`}
                onClick={() => handlePaymentTypeChange('credit-transfer')}
              >
                <div className="payment-type-content">
                  <strong>Credit Transfer</strong>
                  <span>Tag 29 - PromptPay ID</span>
                </div>
              </button>
              <button
                type="button"
                className={`payment-type-button ${formData.paymentType === 'bill-payment' ? 'active' : ''}`}
                onClick={() => handlePaymentTypeChange('bill-payment')}
              >
                <div className="payment-type-content">
                  <strong>Bill Payment</strong>
                  <span>Tag 30 - Biller & References</span>
                </div>
              </button>
            </div>

            <div className="payment-type-info">
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

            {/* QR Mode Toggle */}
            <div className="qr-mode-toggle" style={{ marginTop: '1.5rem' }}>
              <div className="payment-type-selector">
                <button
                  type="button"
                  className={`payment-type-button ${!showMiniQR ? 'active' : ''}`}
                  onClick={() => {
                    setShowMiniQR(false);
                    setMiniQRErrors([]);
                  }}
                >
                  <div className="payment-type-content">
                    <strong>Standard QR</strong>
                    <span>Full PromptPay QR</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`payment-type-button ${showMiniQR ? 'active' : ''}`}
                  onClick={() => {
                    setShowMiniQR(true);
                    setErrors([]);
                  }}
                >
                  <div className="payment-type-content">
                    <strong>Mini QR</strong>
                    <span>Bank Transaction QR</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {showMiniQR ? (
            <div className="form-section">
              <h3>Mini QR Information</h3>

              <div className="info-box" style={{ marginBottom: '1rem' }}>
                <strong>Mini QR - Bank Transaction</strong>
                <p>Compact QR format for bank transactions with bank code and transaction ID.</p>
              </div>

              <div className="form-group">
                <label htmlFor="bankCode">Bank Code (3 digits) *</label>
                <input
                  id="bankCode"
                  type="text"
                  className="form-input"
                  value={miniQRData.bankCode}
                  onChange={(e) => handleMiniQRInputChange('bankCode', e.target.value)}
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
                  onChange={(e) => handleMiniQRInputChange('transactionId', e.target.value)}
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
                  onChange={(e) => handleMiniQRInputChange('countryCode', e.target.value)}
                  placeholder="TH"
                  maxLength={2}
                />
                <span className="field-hint">Country code (default: TH)</span>
              </div>

              {miniQRErrors.length > 0 && (
                <div className="error-messages">
                  {miniQRErrors.map((error, index) => (
                    <div key={index} className="error-message">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button
                  onClick={handleGenerateMiniQR}
                  disabled={isGeneratingMiniQR}
                  className="generate-button"
                >
                  <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  {isGeneratingMiniQR ? 'Generating...' : 'Generate Mini QR'}
                </button>

                <button onClick={handleLoadMiniQRSample} className="sample-button">
                  <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  Load Sample Data
                </button>

                <button onClick={handleClearMiniQR} className="clear-button">
                  <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                  </svg>
                  Clear Form
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-section">
            <h3>Required Information</h3>

            <div className="form-group">
              <label htmlFor="aid">AID (Application Identifier) *</label>
              <select
                id="aid"
                value={formData.aid}
                onChange={(e) => handleInputChange('aid', e.target.value)}
                className="form-input"
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
                  ? 'Select merchant-presented or customer-presented QR'
                  : 'Select domestic or cross-border merchant'}
              </span>
            </div>

            {formData.paymentType === 'credit-transfer' ? (
              <>
                <div className="form-group">
                  <label htmlFor="recipientType">Recipient Type *</label>
                  <select
                    id="recipientType"
                    value={formData.recipientType || 'mobile'}
                    onChange={(e) => handleInputChange('recipientType', e.target.value as RecipientType)}
                    className="form-input"
                  >
                    <option value="mobile">Mobile Number (auto format to 0066...)</option>
                    <option value="national-id">National ID / Tax ID (13 digits)</option>
                    <option value="ewallet">E-Wallet ID (15 digits)</option>
                    <option value="bank-account">Bank Account (up to 43 chars)</option>
                  </select>
                  <span className="field-hint">Type of recipient identifier</span>
                </div>

                <div className="form-group">
                  <label htmlFor="recipientId">
                    {formData.recipientType === 'mobile' ? 'Mobile Number *' : 'Recipient ID *'}
                  </label>
                  <input
                    id="recipientId"
                    type="text"
                    value={formData.recipientId || ''}
                    onChange={(e) => handleInputChange('recipientId', e.target.value)}
                    placeholder={
                      formData.recipientType === 'mobile' ? 'e.g., 0811111111' :
                      formData.recipientType === 'national-id' ? 'e.g., 1234567890123' :
                      formData.recipientType === 'ewallet' ? 'e.g., 123456789012345' :
                      'e.g., 001234567890'
                    }
                    maxLength={43}
                    className="form-input"
                  />
                  <span className="field-hint">
                    {formData.recipientType === 'mobile' && 'Enter 0XXXXXXXXX, 66XXXXXXXXX, or 0066XXXXXXXXX. We normalize to 0066XXXXXXXXX.'}
                    {formData.recipientType === 'national-id' && 'National ID or Tax ID (13 digits)'}
                    {formData.recipientType === 'ewallet' && 'E-Wallet ID (15 digits)'}
                    {formData.recipientType === 'bank-account' && 'Bank account number (up to 43 characters)'}
                  </span>
                </div>

                {formData.aid === 'A000000677010114' && (
                  <div className="form-group">
                    <label htmlFor="ota">OTA *</label>
                    <input
                      id="ota"
                      type="text"
                      value={formData.ota || ''}
                      onChange={(e) => handleInputChange('ota', e.target.value)}
                      placeholder="e.g., 1234567890"
                      maxLength={10}
                      className="form-input"
                    />
                    <span className="field-hint">OTA is mandatory for customer-presented QR (10 digits)</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="billerId">Biller ID *</label>
                  <input
                    id="billerId"
                    type="text"
                    value={formData.billerId || ''}
                    onChange={(e) => handleInputChange('billerId', e.target.value)}
                    placeholder="e.g., 010566300012345"
                    maxLength={32}
                    className="form-input"
                  />
                  <span className="field-hint">National ID/Tax ID with suffix (15 digits)</span>
                </div>

                <div className="form-group">
                  <label htmlFor="reference1">Reference 1 *</label>
                  <input
                    id="reference1"
                    type="text"
                    value={formData.reference1 || ''}
                    onChange={(e) => handleInputChange('reference1', e.target.value)}
                    placeholder="e.g., INV2024001"
                    maxLength={20}
                    className="form-input"
                  />
                  <span className="field-hint">Primary reference (invoice number, bill number, etc.)</span>
                </div>

                <div className="form-group">
                  <label htmlFor="reference2">Reference 2</label>
                  <input
                    id="reference2"
                    type="text"
                    value={formData.reference2 || ''}
                    onChange={(e) => handleInputChange('reference2', e.target.value)}
                    placeholder="e.g., 0876543210"
                    maxLength={20}
                    className="form-input"
                  />
                  <span className="field-hint">Secondary reference (optional, customer ID, phone number, etc.)</span>
                </div>
              </>
            )}
          </div>

          {formData.paymentType === 'bill-payment' && (
            <div className="form-section">
              <h3>Optional Information</h3>

              <div className="form-group">
                <label htmlFor="amount">Amount (THB)</label>
                <input
                  id="amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g., 100.00"
                  min="0"
                  max="999999.99"
                  step="0.01"
                  className="form-input"
                />
                <span className="field-hint">Transaction amount in Thai Baht</span>
              </div>

              <div className="form-group">
                <label htmlFor="merchantName">Merchant Name</label>
                <input
                  id="merchantName"
                  type="text"
                  value={formData.merchantName}
                  onChange={(e) => handleInputChange('merchantName', e.target.value)}
                  placeholder="e.g., ABC Company"
                  maxLength={25}
                  className="form-input"
                />
                <span className="field-hint">Business or merchant name</span>
              </div>

              <div className="form-group">
                <label htmlFor="merchantCity">Merchant City</label>
                <input
                  id="merchantCity"
                  type="text"
                  value={formData.merchantCity}
                  onChange={(e) => handleInputChange('merchantCity', e.target.value)}
                  placeholder="e.g., Bangkok"
                  maxLength={15}
                  className="form-input"
                />
                <span className="field-hint">City where merchant is located</span>
              </div>
            </div>
          )}

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
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>
            
            <button onClick={handleLoadSample} className="sample-button">
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              Load Sample Data
            </button>
            
            <button onClick={handleClear} className="clear-button">
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              </svg>
              Clear Form
            </button>
          </div>
          </>
        )}
        </div>

        <div className="qr-result">
          <h3>QR Code Preview</h3>

          {showMiniQR && generatedMiniQR ? (
            <>
              <div className="qr-display">
                <img
                  src={generatedMiniQR.qrCodeDataURL}
                  alt="Generated Mini QR Code"
                  className="qr-image"
                />

                <div className="qr-actions">
                  <button onClick={handleDownloadMiniQR} className="download-button">
                    <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PNG
                  </button>

                  <button onClick={handleCopyMiniQRString} className="copy-button">
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
                  <code>{generatedMiniQR.qrString}</code>
                </div>
              </div>

              <div className="mini-qr-result">
                <h4>Transaction Details:</h4>
                <div className="mini-qr-details">
                  <div className="mini-qr-detail-item">
                    <label>Bank Code</label>
                    <span>{generatedMiniQR.bankCode}</span>
                  </div>
                  <div className="mini-qr-detail-item">
                    <label>Transaction ID</label>
                    <span>{generatedMiniQR.transactionId}</span>
                  </div>
                  <div className="mini-qr-detail-item">
                    <label>Checksum (CRC)</label>
                    <span>{generatedMiniQR.checksum}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (result || previewResult) ? (
            <>
              <div className="qr-display">
                <img
                  src={(result || previewResult)!.qrCodeDataURL}
                  alt="Generated Thai QR Code"
                  className="qr-image"
                />

                {!result && previewResult && (
                  <div className="preview-badge">
                    <span>Live Preview</span>
                  </div>
                )}

                <div className="qr-actions">
                  <button onClick={handleDownload} className="download-button" disabled={!canExport}>
                    <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PNG
                  </button>

                  <button onClick={handleCopyQRString} className="copy-button" disabled={!canExport}>
                    <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy QR String
                  </button>
                </div>
              </div>

              <div className="qr-string">
                <h4>QR Code String:</h4>
                <div className="qr-string-display">
                  <code>{(result || previewResult)!.qrString}</code>
                </div>
              </div>

              {!result && previewResult && (
                <p className="preview-hint">
                  <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"></path>
                    <path d="M12,17h.01"></path>
                  </svg>
                  This is a live preview. You can download or copy the QR code directly, or click "Generate QR Code" to finalize
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

export default QRGenerator;
