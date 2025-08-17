import QRCode from 'qrcode';

export interface ThaiQRGeneratorInput {
  aid: string;              // Application Identifier (AID)
  billerId: string;         // Biller ID
  reference1: string;       // Reference 1
  reference2?: string;      // Reference 2 (optional)
  amount?: number;          // Transaction amount (optional)
  merchantName?: string;    // Merchant name (optional)
  merchantCity?: string;    // Merchant city (optional)
}

export interface QRGenerationResult {
  qrString: string;
  qrCodeDataURL: string;
}

// CRC16-CCITT calculation for QR code checksum
function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Format TLV (Tag-Length-Value) structure
function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

// Generate sub-tags for Tag 30 (Merchant Account Information)
function generateTag30SubTags(input: ThaiQRGeneratorInput): string {
  let subTags = '';
  
  // Sub-tag 00: Globally Unique Identifier (AID)
  if (input.aid) {
    subTags += formatTLV('00', input.aid);
  }
  
  // Sub-tag 02: Merchant Identifier (Biller ID)
  if (input.billerId) {
    subTags += formatTLV('02', input.billerId);
  }
  
  return subTags;
}

// Generate sub-tags for Tag 62 (Additional Data Field Template)
function generateTag62SubTags(input: ThaiQRGeneratorInput): string {
  let subTags = '';
  
  // Sub-tag 01: Bill Number (Reference 1)
  if (input.reference1) {
    subTags += formatTLV('01', input.reference1);
  }
  
  // Sub-tag 02: Mobile Number or Reference 2
  if (input.reference2) {
    subTags += formatTLV('02', input.reference2);
  }
  
  return subTags;
}

export async function generateThaiQR(input: ThaiQRGeneratorInput): Promise<QRGenerationResult> {
  try {
    // Validate required fields
    if (!input.aid || !input.billerId || !input.reference1) {
      throw new Error('AID, Biller ID, and Reference 1 are required fields');
    }
    
    let qrString = '';
    
    // Tag 00: Payload Format Indicator
    qrString += formatTLV('00', '01');
    
    // Tag 01: Point of Initiation Method
    qrString += formatTLV('01', '12'); // Static QR
    
    // Tag 30: Merchant Account Information
    const tag30SubTags = generateTag30SubTags(input);
    if (tag30SubTags) {
      qrString += formatTLV('30', tag30SubTags);
    }
    
    // Tag 52: Merchant Category Code (default: 0000 for general)
    qrString += formatTLV('52', '0000');
    
    // Tag 53: Transaction Currency (764 = Thai Baht)
    qrString += formatTLV('53', '764');
    
    // Tag 54: Transaction Amount (if provided)
    if (input.amount && input.amount > 0) {
      qrString += formatTLV('54', input.amount.toFixed(2));
    }
    
    // Tag 58: Country Code (TH for Thailand)
    qrString += formatTLV('58', 'TH');
    
    // Tag 59: Merchant Name (if provided)
    if (input.merchantName) {
      qrString += formatTLV('59', input.merchantName);
    }
    
    // Tag 60: Merchant City (if provided)
    if (input.merchantCity) {
      qrString += formatTLV('60', input.merchantCity);
    }
    
    // Tag 62: Additional Data Field Template (References)
    const tag62SubTags = generateTag62SubTags(input);
    if (tag62SubTags) {
      qrString += formatTLV('62', tag62SubTags);
    }
    
    // Tag 63: CRC (will be calculated and appended)
    const qrWithoutCRC = qrString + '6304';
    const crc = calculateCRC16(qrWithoutCRC);
    qrString += formatTLV('63', crc);
    
    // Generate QR Code image
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    return {
      qrString,
      qrCodeDataURL
    };
    
  } catch (error) {
    throw new Error(`Failed to generate Thai QR code: ${error}`);
  }
}

// Validate Thai QR input fields
export function validateQRInput(input: Partial<ThaiQRGeneratorInput>): string[] {
  const errors: string[] = [];
  
  if (!input.aid?.trim()) {
    errors.push('AID (Application Identifier) is required');
  } else if (input.aid.length > 32) {
    errors.push('AID must be 32 characters or less');
  }
  
  if (!input.billerId?.trim()) {
    errors.push('Biller ID is required');
  } else if (input.billerId.length > 32) {
    errors.push('Biller ID must be 32 characters or less');
  }
  
  if (!input.reference1?.trim()) {
    errors.push('Reference 1 is required');
  } else if (input.reference1.length > 25) {
    errors.push('Reference 1 must be 25 characters or less');
  }
  
  if (input.reference2 && input.reference2.length > 25) {
    errors.push('Reference 2 must be 25 characters or less');
  }
  
  if (input.amount !== undefined) {
    if (input.amount < 0) {
      errors.push('Amount must be positive');
    } else if (input.amount > 999999.99) {
      errors.push('Amount must be less than 1,000,000');
    }
  }
  
  if (input.merchantName && input.merchantName.length > 25) {
    errors.push('Merchant name must be 25 characters or less');
  }
  
  if (input.merchantCity && input.merchantCity.length > 15) {
    errors.push('Merchant city must be 15 characters or less');
  }
  
  return errors;
}

// Generate sample QR code for testing
export function generateSampleQR(): ThaiQRGeneratorInput {
  return {
    aid: 'A000000677010112',
    billerId: '010566300012345',
    reference1: 'INV2024001',
    reference2: '0876543210',
    amount: 100.00,
    merchantName: 'Sample Merchant',
    merchantCity: 'Bangkok'
  };
}