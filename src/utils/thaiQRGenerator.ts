import QRCode from 'qrcode';
import {
  CURRENCY_CODE_THB,
  COUNTRY_CODE_THAILAND,
  PAYLOAD_FORMAT_VERSION,
  POINT_OF_INITIATION_STATIC,
  DEFAULT_MERCHANT_CATEGORY
} from '../constants/qrFields';

export type PaymentType = 'credit-transfer' | 'bill-payment';
export type RecipientType = 'mobile' | 'national-id' | 'ewallet' | 'bank-account';

export interface ThaiQRGeneratorInput {
  paymentType: PaymentType; // Tag 29 (credit-transfer) or Tag 30 (bill-payment)
  aid: string;              // Application Identifier (AID)

  // Tag 29 fields (Credit Transfer)
  recipientType?: RecipientType;  // Type of recipient identifier
  recipientId?: string;           // Mobile/National ID/E-Wallet/Bank Account
  ota?: string;                   // OTA (mandatory if AID = A000000677010114)

  // Tag 30 fields (Bill Payment)
  billerId?: string;        // Biller ID (Tag 30 subtag 01)
  reference1?: string;      // Reference 1 (Tag 30 subtag 02)
  reference2?: string;      // Reference 2 (Tag 30 subtag 03)

  // Common optional fields
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
    field: 'recipientId',
    maxLength: 43,
    errorMessages: {
      maxLength: 'Recipient ID must be 43 characters or less'
    }
  },
  {
    field: 'ota',
    maxLength: 10,
    errorMessages: {
      maxLength: 'OTA must be 10 characters'
    }
  },
  {
    field: 'billerId',
    maxLength: 32,
    errorMessages: {
      maxLength: 'Biller ID must be 32 characters or less'
    }
  },
  {
    field: 'reference1',
    maxLength: 25,
    errorMessages: {
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
 * Get recipient sub-tag ID based on recipient type for Tag 29
 */
const getRecipientSubTagId = (recipientType: RecipientType): string => {
  switch (recipientType) {
    case 'mobile':
      return '01';        // Mobile Number
    case 'national-id':
      return '02';        // National ID / Tax ID
    case 'ewallet':
      return '03';        // E-Wallet ID
    case 'bank-account':
      return '04';        // Bank Account
    default:
      return '01';
  }
};

/**
 * Generate sub-tags for Tag 29 (PromptPay: Credit Transfer)
 */
const generateTag29SubTags = (input: ThaiQRGeneratorInput): string => {
  let subTags = '';

  // AID (ID "00") - Mandatory
  if (input.aid) {
    subTags += formatTLV('00', input.aid);
  }

  // Recipient Identifier (one is mandatory)
  if (input.recipientId && input.recipientType) {
    const recipientSubTagId = getRecipientSubTagId(input.recipientType);
    subTags += formatTLV(recipientSubTagId, input.recipientId);
  }

  // OTA (ID "05") - Mandatory if AID = A000000677010114
  if (input.ota) {
    subTags += formatTLV('05', input.ota);
  }

  return subTags;
};

/**
 * Generate sub-tags for Tag 30 (PromptPay: Bill Payment)
 */
const generateTag30SubTags = (input: ThaiQRGeneratorInput): string => {
  let subTags = '';

  // AID (ID "00") - Mandatory
  if (input.aid) {
    subTags += formatTLV('00', input.aid);
  }

  // Biller ID (ID "01") - Mandatory
  if (input.billerId) {
    subTags += formatTLV('01', input.billerId);
  }

  // Reference 1 (ID "02") - Mandatory
  if (input.reference1) {
    subTags += formatTLV('02', input.reference1);
  }

  // Reference 2 (ID "03") - Optional
  if (input.reference2) {
    subTags += formatTLV('03', input.reference2);
  }

  return subTags;
};

/**
 * Generate sub-tags for Tag 62 (Additional Data Field Template)
 * Only used for credit transfer (Tag 29) to include references
 */
const generateTag62SubTags = (input: ThaiQRGeneratorInput): string => {
  let subTags = '';

  // For credit transfer, we can include references in Tag 62
  if (input.paymentType === 'credit-transfer') {
    if (input.reference1) {
      subTags += formatTLV('01', input.reference1);
    }

    if (input.reference2) {
      subTags += formatTLV('02', input.reference2);
    }
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

    // Generate Tag 29 (Credit Transfer) or Tag 30 (Bill Payment)
    if (input.paymentType === 'credit-transfer') {
      const tag29SubTags = generateTag29SubTags(input);
      if (tag29SubTags) {
        qrString += formatTLV('29', tag29SubTags);
      }
    } else if (input.paymentType === 'bill-payment') {
      const tag30SubTags = generateTag30SubTags(input);
      if (tag30SubTags) {
        qrString += formatTLV('30', tag30SubTags);
      }
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

  // Validate payment type
  if (!input.paymentType) {
    errors.push('Payment type is required');
    return errors;
  }

  // Validate based on payment type
  if (input.paymentType === 'credit-transfer') {
    // Tag 29 validations
    if (!input.aid || !input.aid.trim()) {
      errors.push('AID (Application Identifier) is required');
    }

    if (!input.recipientId || !input.recipientId.trim()) {
      errors.push('Recipient ID is required for credit transfer');
    }

    if (!input.recipientType) {
      errors.push('Recipient type is required for credit transfer');
    }

    // Check if OTA is required (when AID = A000000677010114)
    if (input.aid === 'A000000677010114' && (!input.ota || !input.ota.trim())) {
      errors.push('OTA is mandatory when AID is A000000677010114 (customer-presented QR)');
    }
  } else if (input.paymentType === 'bill-payment') {
    // Tag 30 validations
    if (!input.aid || !input.aid.trim()) {
      errors.push('AID (Application Identifier) is required');
    }

    if (!input.billerId || !input.billerId.trim()) {
      errors.push('Biller ID is required for bill payment');
    }

    if (!input.reference1 || !input.reference1.trim()) {
      errors.push('Reference 1 is required for bill payment');
    }
  }

  // Validate field lengths and values using rules
  VALIDATION_RULES.forEach(rule => {
    const value = input[rule.field];

    // Skip if value is not present (required checks done above)
    if (!value) return;

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
    paymentType: 'bill-payment',
    aid: 'A000000677010112',
    billerId: '010566300012345',
    reference1: 'INV2024001',
    reference2: '0876543210',
    amount: 100.00,
    merchantName: 'Sample Merchant',
    merchantCity: 'Bangkok'
  };
};

/**
 * Generate sample Credit Transfer QR code for testing
 */
export const generateSampleCreditTransferQR = (): ThaiQRGeneratorInput => {
  return {
    paymentType: 'credit-transfer',
    aid: 'A000000677010111',
    recipientType: 'mobile',
    recipientId: '0066812345678',
    reference1: 'Payment Ref 001',
    reference2: 'Customer ID 123',
    amount: 250.00,
    merchantName: 'Sample Shop',
    merchantCity: 'Bangkok'
  };
};