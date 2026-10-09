import React from 'react';
import { FieldError, useFieldA11y, fieldHintId } from '../shared';

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
  const amountA11y = useFieldA11y('amount', { hasHint: true });
  const merchantNameA11y = useFieldA11y('merchantName');
  const merchantCityA11y = useFieldA11y('merchantCity');

  return (
    <div className="optional-section">
      {showOptionalHeading && (
        <>
          <div className="section-divider" />
          <h3 className="optional-heading">Optional information</h3>
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
            {...amountA11y}
          />
        </div>
        <span className="field-hint" id={fieldHintId('amount')}>Amount in Thai Baht (THB)</span>
        <FieldError field="amount" />
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
            {...merchantNameA11y}
          />
          <FieldError field="merchantName" />
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
            {...merchantCityA11y}
          />
          <FieldError field="merchantCity" />
        </div>
      </div>
    </div>
  );
};

export default CommonFields;
