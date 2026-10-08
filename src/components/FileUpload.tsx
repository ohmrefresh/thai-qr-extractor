import React, { useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { parseThaiQR } from '../utils/thaiQRParser';
import { formatParseError } from '../utils/qrUtils';

interface FileUploadProps {
  onScanSuccess: (data: any) => void;
  onScanError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onScanSuccess, onScanError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onScanError('That file isn\'t an image. Choose a PNG, JPG or WebP file.');
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          onScanError('Your browser couldn\'t process this image. Try another browser, or paste the QR string instead.');
          setIsProcessing(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const parsedData = parseThaiQR(code.data);
            onScanSuccess(parsedData);
          } catch (error) {
            onScanError(formatParseError(error));
          }
        } else {
          onScanError('No QR code found in this image. Use a sharp image with the whole code visible, including its quiet border.');
        }
        setIsProcessing(false);
      };
      
      img.onerror = () => {
        onScanError('This file couldn\'t be opened as an image. Choose a PNG, JPG or WebP file.');
        setIsProcessing(false);
      };
      
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      onScanError('The file couldn\'t be read. Try selecting it again.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processImage(file);
    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImage(file);
    }
  }, []);

  const triggerFileInput = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden-input"
        disabled={isProcessing}
      />
      
      <div className="card-header">
        <div className="card-icon accent-upload">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17,8 12,3 7,8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <div>
          <h3 className="card-title">Upload Image</h3>
          <p className="card-subtitle">Drop a screenshot or photo of a QR code to decode it</p>
        </div>
      </div>

      <button 
        type="button" 
        className={`upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
        onClick={triggerFileInput}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="upload-dropzone-icon">
              <div className="spinner spinner--lg" aria-hidden="true"></div>
            </div>
            <div className="dropzone-content">
              <span className="dropzone-title">Processing...</span>
              <span className="dropzone-subtitle">Decoding QR code</span>
            </div>
          </>
        ) : (
          <>
            <div className="upload-dropzone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17,8 12,3 7,8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="dropzone-content">
              <span className="dropzone-title">Drop an image here, or click to choose one</span>
              <span className="dropzone-subtitle">PNG, JPG or WebP</span>
            </div>
          </>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
