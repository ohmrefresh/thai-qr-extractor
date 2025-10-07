import React, { useRef } from 'react';
import jsQR from 'jsqr';
import { parseThaiQR } from '../utils/thaiQRParser';

interface FileUploadProps {
  onScanSuccess: (data: any) => void;
  onScanError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onScanSuccess, onScanError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onScanError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          onScanError('Failed to create canvas context');
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
            onScanError(`Failed to parse QR code: ${error}`);
          }
        } else {
          onScanError('No QR code found in the image');
        }
      };
      
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden-input"
      />
      <div className="card-header">
        <div className="card-icon accent-upload">
          <svg className="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17,8 12,3 7,8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <div>
          <h3 className="card-title">Upload image</h3>
          <p className="card-subtitle">Select a QR code image from your device for automatic parsing.</p>
        </div>
      </div>
      <button type="button" className="upload-dropzone" onClick={triggerFileInput}>
        <svg className="icon icon-lg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17,8 12,3 7,8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span className="dropzone-title">Browse image</span>
        <span className="dropzone-subtitle">PNG or JPG up to 5 MB</span>
      </button>
    </div>
  );
};

export default FileUpload;
