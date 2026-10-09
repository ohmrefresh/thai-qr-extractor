import React from 'react';
import { FieldError, useFieldA11y, fieldHintId } from '../shared';

interface BillPaymentFieldsProps {
  billerId: string;
  reference1: string;
  reference2: string;
  onBillerIdChange: (id: string) => void;
  onReference1Change: (ref: string) => void;
  onReference2Change: (ref: string) => void;
}

const BillPaymentFields: React.FC<BillPaymentFieldsProps> = ({
  billerId,
  reference1,
  reference2,
  onBillerIdChange,
  onReference1Change,
  onReference2Change
}) => {
  const billerIdA11y = useFieldA11y('billerId', { hasHint: true });
  const reference1A11y = useFieldA11y('reference1', { hasHint: true });
  const reference2A11y = useFieldA11y('reference2', { hasHint: true });

  return (
    <div className="dynamic-fields">
      <div className="form-field">
        <label htmlFor="billerId">
          <span className="field-label">Biller ID</span>
          <span className="field-required">*</span>
        </label>
        <input
          id="billerId"
          type="text"
          value={billerId}
          onChange={(e) => onBillerIdChange(e.target.value)}
          placeholder="010555500012345"
          maxLength={32}
          className="form-input"
          {...billerIdA11y}
        />
        <span className="field-hint" id={fieldHintId('billerId')}>National ID/Tax ID with suffix (15 digits)</span>
        <FieldError field="billerId" />
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
            value={reference1}
            onChange={(e) => onReference1Change(e.target.value)}
            placeholder="INV2024001"
            maxLength={20}
            className="form-input"
            {...reference1A11y}
          />
          <span className="field-hint" id={fieldHintId('reference1')}>Primary reference number</span>
          <FieldError field="reference1" />
        </div>

        <div className="form-field">
          <label htmlFor="reference2">
            <span className="field-label">Reference 2</span>
            <span className="field-optional">(Optional)</span>
          </label>
          <input
            id="reference2"
            type="text"
            value={reference2}
            onChange={(e) => onReference2Change(e.target.value)}
            placeholder="Customer ID"
            maxLength={20}
            className="form-input"
            {...reference2A11y}
          />
          <span className="field-hint" id={fieldHintId('reference2')}>Secondary reference</span>
          <FieldError field="reference2" />
        </div>
      </div>
    </div>
  );
};

export default BillPaymentFields;
