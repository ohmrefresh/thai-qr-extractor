import React, { useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { parseThaiQR } from '../utils/thaiQRParser';
import { toast } from 'sonner';

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
      onScanError('Please select an image file');
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
          onScanError('Failed to create canvas context');
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
            toast.success('QR code decoded successfully');
          } catch (error) {
            onScanError(`Failed to parse QR code: ${error}`);
          }
        } else {
          toast.error('No QR code found in image');
          onScanError('No QR code found in the image');
        }
        setIsProcessing(false);
      };
      
      img.onerror = () => {
        onScanError('Failed to load image');
        setIsProcessing(false);
      };
      
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      onScanError('Failed to read file');
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
          <p className="card-subtitle">Select or drag a QR code image for instant decoding</p>
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
              <div className="spinner" style={{ width: '32px', height: '32px', borderColor: 'rgba(245, 158, 11, 0.2)', borderTopColor: '#d97706' }}></div>
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
              <span className="dropzone-title">Click or drop image here</span>
              <span className="dropzone-subtitle">Supports PNG, JPG, WebP up to 10MB</span>
            </div>
            <span className="dropzone-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              Browse files
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
