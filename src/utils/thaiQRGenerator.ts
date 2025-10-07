import QRCode from 'qrcode';
import {
  CURRENCY_CODE_THB,
  COUNTRY_CODE_THAILAND,
  PAYLOAD_FORMAT_VERSION,
  POINT_OF_INITIATION_STATIC,
  DEFAULT_MERCHANT_CATEGORY
} from '../constants/qrFields';

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

interface ValidationRule {
  field: keyof ThaiQRGeneratorInput;
  required?: boolean;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  errorMessages: {
    required?: string;
    maxLength?: string;
    range?: string;
  };
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'aid',
    required: true,
    maxLength: 32,
    errorMessages: {
      required: 'AID (Application Identifier) is required',
      maxLength: 'AID must be 32 characters or less'
    }
  },
  {
    field: 'billerId',
    required: true,
    maxLength: 32,
    errorMessages: {
      required: 'Biller ID is required',
      maxLength: 'Biller ID must be 32 characters or less'
    }
  },
  {
    field: 'reference1',
    required: true,
    maxLength: 25,
    errorMessages: {
      required: 'Reference 1 is required',
      maxLength: 'Reference 1 must be 25 characters or less'
    }
  },
  {
    field: 'reference2',
    maxLength: 25,
    errorMessages: {
      maxLength: 'Reference 2 must be 25 characters or less'
    }
  },
  {
    field: 'amount',
    minValue: 0,
    maxValue: 999999.99,
    errorMessages: {
      range: 'Amount must be between 0 and 999,999.99'
    }
  },
  {
    field: 'merchantName',
    maxLength: 25,
    errorMessages: {
      maxLength: 'Merchant name must be 25 characters or less'
    }
  },
  {
    field: 'merchantCity',
    maxLength: 15,
    errorMessages: {
      maxLength: 'Merchant city must be 15 characters or less'
    }
  }
];

/**
 * CRC16-CCITT calculation for QR code checksum
 */
const calculateCRC16 = (data: string): string => {
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
};

/**
 * Format TLV (Tag-Length-Value) structure
 */
const formatTLV = (tag: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
};

/**
 * Generate sub-tags for Tag 30 (Merchant Account Information)
 */
const generateTag30SubTags = (input: ThaiQRGeneratorInput): string => {
  let subTags = '';
  
  if (input.aid) {
    subTags += formatTLV('00', input.aid);
  }
  
  if (input.billerId) {
    subTags += formatTLV('02', input.billerId);
  }
  
  return subTags;
};

/**
 * Generate sub-tags for Tag 62 (Additional Data Field Template)
 */
const generateTag62SubTags = (input: ThaiQRGeneratorInput): string => {
  let subTags = '';
  
  if (input.reference1) {
    subTags += formatTLV('01', input.reference1);
  }
  
  if (input.reference2) {
    subTags += formatTLV('02', input.reference2);
  }
  
  return subTags;
};

/**
 * Generate Thai QR code
 */
export const generateThaiQR = async (input: ThaiQRGeneratorInput): Promise<QRGenerationResult> => {
  try {
    const errors = validateQRInput(input);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    let qrString = '';
    
    // Build QR string with required and optional fields
    qrString += formatTLV('00', PAYLOAD_FORMAT_VERSION);
    qrString += formatTLV('01', POINT_OF_INITIATION_STATIC);
    
    const tag30SubTags = generateTag30SubTags(input);
    if (tag30SubTags) {
      qrString += formatTLV('30', tag30SubTags);
    }
    
    qrString += formatTLV('52', DEFAULT_MERCHANT_CATEGORY);
    qrString += formatTLV('53', CURRENCY_CODE_THB);
    
    if (input.amount && input.amount > 0) {
      qrString += formatTLV('54', input.amount.toFixed(2));
    }
    
    qrString += formatTLV('58', COUNTRY_CODE_THAILAND);
    
    if (input.merchantName) {
      qrString += formatTLV('59', input.merchantName);
    }
    
    if (input.merchantCity) {
      qrString += formatTLV('60', input.merchantCity);
    }
    
    const tag62SubTags = generateTag62SubTags(input);
    if (tag62SubTags) {
      qrString += formatTLV('62', tag62SubTags);
    }
    
    // Calculate and append CRC
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
};

/**
 * Validate Thai QR input fields
 */
export const validateQRInput = (input: Partial<ThaiQRGeneratorInput>): string[] => {
  const errors: string[] = [];
  
  VALIDATION_RULES.forEach(rule => {
    const value = input[rule.field];
    
    // Check required fields
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      if (rule.errorMessages.required) {
        errors.push(rule.errorMessages.required);
      }
      return;
    }
    
    // Check max length for string fields
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      if (rule.errorMessages.maxLength) {
        errors.push(rule.errorMessages.maxLength);
      }
    }
    
    // Check numeric ranges
    if (typeof value === 'number') {
      if (rule.minValue !== undefined && value < rule.minValue) {
        if (rule.errorMessages.range) {
          errors.push(rule.errorMessages.range);
        }
      }
      if (rule.maxValue !== undefined && value > rule.maxValue) {
        if (rule.errorMessages.range) {
          errors.push(rule.errorMessages.range);
        }
      }
    }
  });
  
  return errors;
};

/**
 * Generate sample QR code for testing
 */
export const generateSampleQR = (): ThaiQRGeneratorInput => {
  return {
    aid: 'A000000677010112',
    billerId: '010566300012345',
    reference1: 'INV2024001',
    reference2: '0876543210',
    amount: 100.00,
    merchantName: 'Sample Merchant',
    merchantCity: 'Bangkok'
  };
};