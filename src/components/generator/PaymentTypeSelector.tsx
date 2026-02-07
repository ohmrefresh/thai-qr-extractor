import React from 'react';
import { PaymentType } from '../../utils/thaiQRGenerator';
import { CreditTransferIcon, DocumentIcon, QRCodeIcon } from '../icons';

type PaymentMode = PaymentType | 'mini-qr';

interface PaymentTypeSelectorProps {
  selectedType: PaymentMode;
  onTypeChange: (type: PaymentMode) => void;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <div className="payment-type-tabs">
      <button
        type="button"
        className={`payment-tab ${selectedType === 'credit-transfer' ? 'active' : ''}`}
        onClick={() => onTypeChange('credit-transfer')}
      >
        <div className="tab-icon">
          <CreditTransferIcon width={20} height={20} />
        </div>
        <div className="tab-content">
          <strong>Credit Transfer</strong>
          <span>Tag 29 - PromptPay Credit Transfer</span>
        </div>
      </button>
      <button
        type="button"
        className={`payment-tab ${selectedType === 'bill-payment' ? 'active' : ''}`}
        onClick={() => onTypeChange('bill-payment')}
      >
        <div className="tab-icon">
          <DocumentIcon width={20} height={20} />
        </div>
        <div className="tab-content">
          <strong>Bill Payment</strong>
          <span>Tag 30 - PromptPay Bill Payment</span>
        </div>
      </button>
      <button
        type="button"
        className={`payment-tab ${selectedType === 'mini-qr' ? 'active' : ''}`}
        onClick={() => onTypeChange('mini-qr')}
      >
        <div className="tab-icon">
          <QRCodeIcon width={20} height={20} />
        </div>
        <div className="tab-content">
          <strong>Mini QR</strong>
          <span>Bank Transaction QR</span>
        </div>
      </button>
    </div>
  );
};

export default PaymentTypeSelector;
