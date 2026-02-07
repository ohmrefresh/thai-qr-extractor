import React from 'react';
import { RecipientType } from '../../utils/thaiQRGenerator';

interface CreditTransferFieldsProps {
  recipientType: RecipientType;
  recipientId: string;
  ota: string;
  aid: string;
  onRecipientTypeChange: (type: RecipientType) => void;
  onRecipientIdChange: (id: string) => void;
  onOtaChange: (ota: string) => void;
}

const CreditTransferFields: React.FC<CreditTransferFieldsProps> = ({
  recipientType,
  recipientId,
  ota,
  aid,
  onRecipientTypeChange,
  onRecipientIdChange,
  onOtaChange
}) => {
  const getRecipientLabel = () => {
    return recipientType === 'mobile' ? 'Mobile Number' : 'Recipient ID';
  };

  const getRecipientPlaceholder = () => {
    switch (recipientType) {
      case 'mobile':
        return '0XXXXXXXXX';
      case 'national-id':
        return '1-1111-11111-11-1';
      case 'ewallet':
        return 'E-Wallet ID';
      case 'bank-account':
        return 'Bank Account';
      default:
        return '';
    }
  };

  const getRecipientHint = () => {
    switch (recipientType) {
      case 'mobile':
        return 'Auto-normalizes to 0066 format';
      case 'national-id':
        return '13-digit National or Tax ID';
      case 'ewallet':
        return '15-digit E-Wallet identifier';
      case 'bank-account':
        return 'Up to 43 characters';
      default:
        return '';
    }
  };

  return (
    <div className="dynamic-fields">
      <div className="form-field">
        <label htmlFor="recipientType">
          <span className="field-label">Recipient Type</span>
          <span className="field-required">*</span>
        </label>
        <select
          id="recipientType"
          value={recipientType}
          onChange={(e) => onRecipientTypeChange(e.target.value as RecipientType)}
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
          <span className="field-label">{getRecipientLabel()}</span>
          <span className="field-required">*</span>
        </label>
        <input
          id="recipientId"
          type="text"
          value={recipientId}
          onChange={(e) => onRecipientIdChange(e.target.value)}
          placeholder={getRecipientPlaceholder()}
          maxLength={43}
          className="form-input"
        />
        <span className="field-hint">{getRecipientHint()}</span>
      </div>

      {aid === 'A000000677010114' && (
        <div className="form-field">
          <label htmlFor="ota">
            <span className="field-label">OTA (One-Time Authorization)</span>
            <span className="field-required">*</span>
          </label>
          <input
            id="ota"
            type="text"
            value={ota}
            onChange={(e) => onOtaChange(e.target.value)}
            placeholder="10-digit code"
            maxLength={10}
            className="form-input"
          />
          <span className="field-hint">Required for customer-presented QR</span>
        </div>
      )}
    </div>
  );
};

export default CreditTransferFields;
