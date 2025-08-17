import React, { useState } from 'react';
import { 
  generateThaiQR, 
  validateQRInput, 
  generateSampleQR,
  ThaiQRGeneratorInput, 
  QRGenerationResult 
} from '../utils/thaiQRGenerator';

interface QRGeneratorProps {
  onQRGenerated?: (qrData: string) => void;
  onClose?: () => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ onQRGenerated, onClose }) => {
  const [formData, setFormData] = useState<ThaiQRGeneratorInput>({
    aid: '',
    billerId: '',
    reference1: '',
    reference2: '',
    amount: undefined,
    merchantName: '',
    merchantCity: ''
  });
  
  const [result, setResult] = useState<QRGenerationResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
      
      if (onQRGenerated) {
        onQRGenerated(qrResult.qrString);
      }
    } catch (error) {
      setErrors([`Generation failed: ${error}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadSample = () => {
    const sampleData = generateSampleQR();
    setFormData(sampleData);
    setResult(null);
    setErrors([]);
  };

  const handleClear = () => {
    setFormData({
      aid: '',
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
    if (!result) return;
    
    const link = document.createElement('a');
    link.download = 'thai-qr-code.png';
    link.href = result.qrCodeDataURL;
    link.click();
  };

  const handleCopyQRString = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result.qrString);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy QR string:', error);
    }
  };

  return (
    <div className="qr-generator">
      <div className="generator-header">
        <h2>Generate Thai QR Code</h2>
        <p>Create QR codes with Tag 30 merchant account information</p>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="generator-content">
        <div className="generator-form">
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
                <option value="A000000677010112">A000000677010112 - Domestic Merchant</option>
                <option value="A000000677012006">A000000677012006 - Cross-Border Merchant</option>
                <option value="A000000677010111">A000000677010111 - PromptPay</option>
              </select>
              <span className="field-hint">Select the appropriate AID for your merchant type</span>
            </div>

            <div className="form-group">
              <label htmlFor="billerId">Biller ID *</label>
              <input
                id="billerId"
                type="text"
                value={formData.billerId}
                onChange={(e) => handleInputChange('billerId', e.target.value)}
                placeholder="e.g., 010566300012345"
                maxLength={32}
                className="form-input"
              />
              <span className="field-hint">Merchant or biller identification number</span>
            </div>

            <div className="form-group">
              <label htmlFor="reference1">Reference 1 *</label>
              <input
                id="reference1"
                type="text"
                value={formData.reference1}
                onChange={(e) => handleInputChange('reference1', e.target.value)}
                placeholder="e.g., INV2024001"
                maxLength={25}
                className="form-input"
              />
              <span className="field-hint">Primary reference (invoice number, bill number, etc.)</span>
            </div>
          </div>

          <div className="form-section">
            <h3>Optional Information</h3>
            
            <div className="form-group">
              <label htmlFor="reference2">Reference 2</label>
              <input
                id="reference2"
                type="text"
                value={formData.reference2}
                onChange={(e) => handleInputChange('reference2', e.target.value)}
                placeholder="e.g., 0876543210"
                maxLength={25}
                className="form-input"
              />
              <span className="field-hint">Secondary reference (customer ID, phone number, etc.)</span>
            </div>

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>
            
            <button onClick={handleLoadSample} className="sample-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              Load Sample Data
            </button>
            
            <button onClick={handleClear} className="clear-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              </svg>
              Clear Form
            </button>
          </div>
        </div>

        <div className="qr-result">
          <h3>QR Code Preview</h3>
          
          {result ? (
            <>
              <div className="qr-display">
                <img 
                  src={result.qrCodeDataURL} 
                  alt="Generated Thai QR Code"
                  className="qr-image"
                />
                
                <div className="qr-actions">
                  <button onClick={handleDownload} className="download-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PNG
                  </button>
                  
                  <button onClick={handleCopyQRString} className="copy-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <code>{result.qrString}</code>
                </div>
              </div>
            </>
          ) : (
            <div className="qr-placeholder">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <p>Fill in the form and click "Generate QR Code" to see your QR code here</p>
              {isGenerating && (
                <div className="generating-spinner">
                  <div className="spinner"></div>
                  <span>Generating QR code...</span>
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