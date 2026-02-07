import QRCode from 'qrcode';

export interface MiniQRInput {
  bankCode: string;        // 3 digits
  transactionId: string;   // max 50 chars
  countryCode?: string;    // default "TH"
}

export interface MiniQRResult {
  qrString: string;
  qrCodeDataURL: string;
  bankCode: string;
  transactionId: string;
  checksum: string;
}

/**
 * Calculate CRC16-XModem checksum
 * Matches Kotlin implementation: crc16XModem
 */
const calculateCRC16XModem = (data: string): string => {
  let crc = 0xFFFF;
  const bytes = new TextEncoder().encode(data);
  
  for (let i = 0; i < bytes.length; i++) {
    crc = crc ^ (bytes[i] << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc = crc & 0xFFFF;
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Encode TLV (Tag-Length-Value) format
 */
const encodeTLV = (tag: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
};

/**
 * Generate Mini QR for bank transactions
 * Format: Tag 00 (Payload with sub-tags) + Tag 51 (Country) + Tag 91 (CRC)
 *
 * Tag 00 sub-tags:
 * - 00: Payload Format Indicator (always "000001")
 * - 01: Bank Code (3 digits)
 * - 02: Transaction ID
 */
export const generateMiniQR = async (input: MiniQRInput): Promise<MiniQRResult> => {
  const { bankCode, transactionId, countryCode = 'TH' } = input;

  // Validate inputs
  if (!bankCode || bankCode.length !== 3 || !/^\d{3}$/.test(bankCode)) {
    throw new Error('Bank code must be exactly 3 digits');
  }

  if (!transactionId || transactionId.length > 50) {
    throw new Error('Transaction ID is required and must be 50 characters or less');
  }

  // Build sub-tags for Tag 00 (Payload)
  // Sub-tag 00: Payload Format Indicator (always 000001)
  const subTag00 = encodeTLV('00', '000001');
  // Sub-tag 01: Bank Code
  const subTag01 = encodeTLV('01', bankCode);
  // Sub-tag 02: Transaction ID
  const subTag02 = encodeTLV('02', transactionId);

  // Combine sub-tags into Tag 00 value
  const tag00Value = `${subTag00}${subTag01}${subTag02}`;
  const tag00 = encodeTLV('00', tag00Value);

  // Tag 51 - Country Code (default TH)
  const tag51 = encodeTLV('51', countryCode);

  // Combine tags for CRC calculation
  const dataWithoutCRC = `${tag00}${tag51}9104`;

  // Calculate CRC
  const crcValue = calculateCRC16XModem(dataWithoutCRC);

  // Tag 91 - CRC
  const tag91 = encodeTLV('91', crcValue);

  // Final QR string
  const qrString = `${dataWithoutCRC}${tag91}`;

  // Generate QR code image
  const qrCodeDataURL = await QRCode.toDataURL(qrString, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  return {
    qrString,
    qrCodeDataURL,
    bankCode,
    transactionId,
    checksum: crcValue
  };
};

export const validateMiniQRInput = (input: Partial<MiniQRInput>): string[] => {
  const errors: string[] = [];

  if (!input.bankCode) {
    errors.push('Bank code is required');
  } else if (input.bankCode.length !== 3 || !/^\d{3}$/.test(input.bankCode)) {
    errors.push('Bank code must be exactly 3 digits');
  }

  if (!input.transactionId) {
    errors.push('Transaction ID is required');
  } else if (input.transactionId.length > 50) {
    errors.push('Transaction ID must be 50 characters or less');
  }

  return errors;
};
