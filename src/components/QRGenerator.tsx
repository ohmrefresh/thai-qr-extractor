import React, { useState } from 'react';
import { PaymentType } from '../utils/thaiQRGenerator';
import PaymentTypeSelector from './generator/PaymentTypeSelector';
import StandardQRGenerator from './generator/StandardQRGenerator';
import MiniQRGenerator from './MiniQRGenerator';

interface QRGeneratorProps {
  onQRGenerated?: (qrData: string) => void;
  onClose?: () => void;
}

type PaymentMode = PaymentType | 'mini-qr';

const QRGenerator: React.FC<QRGeneratorProps> = ({ onQRGenerated, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('bill-payment');

  const handleModeChange = (mode: PaymentMode) => {
    setSelectedMode(mode);
  };

  return (
    <div className="generator-container-modern">
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close generator"
          className="generator-close-button"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Payment Type Selector */}
      <PaymentTypeSelector
        selectedType={selectedMode}
        onTypeChange={handleModeChange}
      />

      {/* Render appropriate generator based on selected mode */}
      {selectedMode === 'mini-qr' ? (
        <MiniQRGenerator onQRGenerated={onQRGenerated} />
      ) : (
        <StandardQRGenerator
          paymentType={selectedMode}
          onQRGenerated={onQRGenerated}
        />
      )}
    </div>
  );
};

export default QRGenerator;
