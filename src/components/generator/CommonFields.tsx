import React from 'react';

interface CommonFieldsProps {
  amount?: number;
  merchantName: string;
  merchantCity: string;
  onAmountChange: (amount: number | undefined) => void;
  onMerchantNameChange: (name: string) => void;
  onMerchantCityChange: (city: string) => void;
  showOptionalHeading?: boolean;
}

const CommonFields: React.FC<CommonFieldsProps> = ({
  amount,
  merchantName,
  merchantCity,
  onAmountChange,
  onMerchantNameChange,
  onMerchantCityChange,
  showOptionalHeading = false
}) => {
  return (
    <div className="optional-section">
      {showOptionalHeading && (
        <>
          <div className="section-divider" />
          <h4 className="optional-heading">Optional Information</h4>
        </>
      )}

      <div className="form-field">
        <label htmlFor="amount">Amount (THB)</label>
        <div className="input-with-prefix">
          <span className="input-prefix">฿</span>
          <input
            id="amount"
            type="number"
            value={amount || ''}
            onChange={(e) => onAmountChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
            value={merchantName}
            onChange={(e) => onMerchantNameChange(e.target.value)}
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
            value={merchantCity}
            onChange={(e) => onMerchantCityChange(e.target.value)}
            placeholder="Bangkok"
            maxLength={15}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
};

export default CommonFields;
