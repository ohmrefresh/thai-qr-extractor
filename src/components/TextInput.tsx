import React, { useState } from 'react';
import { parseThaiQR } from '../utils/thaiQRParser';

interface TextInputProps {
  onScanSuccess: (data: any) => void;
  onScanError: (error: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onScanSuccess, onScanError }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = () => {
    if (!inputText.trim()) {
      onScanError('Please enter QR code data');
      return;
    }

    setIsProcessing(true);
    
    try {
      const parsedData = parseThaiQR(inputText.trim());
      onScanSuccess(parsedData);
      setInputText('');
    } catch (error) {
      onScanError(`Failed to parse QR code: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmit();
    }
  };

  const clearInput = () => {
    setInputText('');
  };

  return (
    <div className="text-input">
      <div className="card-header">
        <div className="card-icon accent-text">
          <svg className="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
        </div>
        <div>
          <h3 className="card-title">Paste QR payload</h3>
          <p className="card-subtitle">Drop in raw EMVCo strings to inspect every parsed field.</p>
        </div>
      </div>

      <textarea
        value={inputText}
        onChange={handleTextChange}
        onKeyDown={handleKeyPress}
        placeholder="Paste raw QR code data here..."
        className="qr-textarea"
        rows={5}
        disabled={isProcessing}
      />

      <div className="input-controls">
        <button 
          onClick={handleSubmit} 
          className="upload-button"
          disabled={!inputText.trim() || isProcessing}
        >
          <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4"></path>
            <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1s.448 1 1 1h5v5c0 .552.448 1 1 1z"></path>
            <path d="M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H4v-5c0-.552-.448-1-1-1z"></path>
            <path d="M12 3c0-.552-.448-1-1-1H5c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V4h5c.552 0 1-.448 1-1z"></path>
            <path d="M12 21c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1s-1 .448-1 1v5h-5c-.552 0-1 .448-1 1z"></path>
          </svg>
          {isProcessing ? 'Processing...' : 'Parse QR data'}
        </button>

        {inputText && (
          <button 
            onClick={clearInput} 
            className="clear-input-button"
            disabled={isProcessing}
          >
            <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear
          </button>
        )}
      </div>

      <p className="input-hint">
        <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"></path>
          <path d="M12,17h.01"></path>
        </svg>
        Tip: Press Ctrl+Enter (Cmd+Enter) to parse instantly
      </p>
    </div>
  );
};

export default TextInput;
