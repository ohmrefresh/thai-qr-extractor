import React, { useState, useCallback } from 'react';
import { parseThaiQR } from '../utils/thaiQRParser';
import { formatParseError } from '../utils/qrUtils';

interface TextInputProps {
  onScanSuccess: (data: any) => void;
  onScanError: (error: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onScanSuccess, onScanError }) => {
  const [inputText, setInputText] = useState('');

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) {
      onScanError('Paste a QR payload first. It usually starts with 000201.');
      return;
    }

    // Parsing is synchronous and sub-millisecond; no artificial "processing" delay
    try {
      const parsedData = parseThaiQR(inputText.trim());
      onScanSuccess(parsedData);
      setInputText('');
    } catch (error) {
      onScanError(formatParseError(error));
    }
  }, [inputText, onScanSuccess, onScanError]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const clearInput = () => {
    setInputText('');
  };

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="text-input">
      <div className="card-header">
        <div className="card-icon accent-text">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
        </div>
        <div>
          <h3 className="card-title">Paste QR Payload</h3>
          <p className="card-subtitle">Paste the raw EMVCo string to see every tag, sub-tag and CRC check</p>
        </div>
      </div>

      <div className="qr-textarea-wrapper">
        <textarea
          value={inputText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="00020101021229370016..."
          className="qr-textarea"
          rows={4}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {inputText.length > 0 && (
          <span className="char-counter">
            {inputText.length.toLocaleString()} chars
          </span>
        )}
      </div>

      <div className="input-controls">
        <button 
          onClick={handleSubmit} 
          className="parse-button"
          disabled={!inputText.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          Parse QR Data
        </button>

        {inputText && (
          <button 
            onClick={clearInput} 
            className="clear-input-button"
            title="Clear input"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear
          </button>
        )}
      </div>

      <p className="input-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9,9h0a3,3 0 0 1,6,0c0,2 -3,3 -3,3"></path>
          <path d="M12,17h.01"></path>
        </svg>
        Press <span className="kbd-shortcut">{isMac ? '⌘' : 'Ctrl'} + Enter</span> to parse instantly
      </p>
    </div>
  );
};

export default TextInput;
