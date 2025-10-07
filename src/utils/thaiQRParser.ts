import {
  FIELD_DESCRIPTIONS,
  SUB_TAG_DESCRIPTIONS,
  GENERIC_SUB_TAG_DESCRIPTIONS
} from '../constants/qrFields';

export interface QRSubTag {
  tag: string;
  length: number;
  value: string;
  description: string;
}

export interface QRField {
  tag: string;
  length: number;
  value: string;
  description: string;
  subTags?: QRSubTag[];
}

export interface ThaiQRData {
  version: string;
  type: string;
  merchantId?: string;
  merchantName?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  checksum?: string;
  rawData: string;
  parsedFields: QRField[];
}

interface TLVData {
  tag: string;
  length: number;
  value: string;
}

/**
 * Parse Tag-Length-Value (TLV) encoded data
 */
const parseTLV = (data: string, startIndex: number): TLVData | null => {
  if (startIndex + 4 > data.length) return null;
  
  const tag = data.substr(startIndex, 2);
  const lengthStr = data.substr(startIndex + 2, 2);
  const length = parseInt(lengthStr, 10);
  
  if (isNaN(length) || startIndex + 4 + length > data.length) {
    return null;
  }
  
  const value = data.substr(startIndex + 4, length);
  
  return { tag, length, value };
};

/**
 * Validate if a string is a valid TLV tag (2 numeric digits)
 */
const isValidTag = (tag: string): boolean => {
  return /^\d{2}$/.test(tag);
};

/**
 * Parse Thai QR code data into structured format
 */
export const parseThaiQR = (qrData: string): ThaiQRData => {
  const result: ThaiQRData = {
    version: '',
    type: '',
    rawData: qrData,
    parsedFields: []
  };

  try {
    let index = 0;
    
    while (index < qrData.length) {
      const tlv = parseTLV(qrData, index);
      if (!tlv) break;
      
      const { tag, length, value } = tlv;
      
      const field: QRField = {
        tag,
        length,
        value,
        description: getFieldDescription(tag),
        subTags: parseSubTags(tag, value)
      };
      
      result.parsedFields.push(field);
      
      // Extract relevant field values
      extractFieldValue(result, field);
      
      index += 4 + length;
    }
    
    if (!result.parsedFields.length) {
      throw new Error('No valid QR code fields found');
    }
    
    return result;
    
  } catch (error) {
    throw new Error(`Failed to parse Thai QR code: ${error}`);
  }
};

/**
 * Extract specific field values into the result object
 */
const extractFieldValue = (result: ThaiQRData, field: QRField): void => {
  const { tag, value } = field;
  
  switch (tag) {
    case '00':
      result.version = value;
      break;
    case '01':
      result.type = value;
      break;
    case '15':
    case '29':
      if (value.toLowerCase().includes('promptpay')) {
        result.merchantId = extractPromptPayId(value);
        result.merchantName = 'PromptPay';
      }
      break;
    case '30':
      result.merchantId = extractMerchantId(field.subTags);
      break;
    case '54':
      result.amount = parseFloat(value);
      break;
    case '53':
      result.currency = value;
      break;
    case '59':
      result.merchantName = value;
      break;
    case '05':
    case '07':
      result.reference = value;
      break;
    case '63':
      result.checksum = value;
      break;
  }
};

/**
 * Extract PromptPay ID from value
 */
const extractPromptPayId = (value: string): string => {
  const parts = value.split('.');
  return parts[parts.length - 1] || value;
};

/**
 * Extract merchant ID from sub-tags
 */
const extractMerchantId = (subTags?: QRSubTag[]): string => {
  if (!subTags) return '';
  
  // Look for merchant identifier in sub-tag 02 or 03
  const merchantSubTag = subTags.find(tag => tag.tag === '02' || tag.tag === '03');
  return merchantSubTag?.value || '';
};

/**
 * Parse sub-tags from a TLV value
 */
const parseSubTags = (parentTag: string, value: string): QRSubTag[] | undefined => {
  if (value.length < 4) return undefined;
  
  const subTags: QRSubTag[] = [];
  let index = 0;

  try {
    while (index < value.length) {
      const tlv = parseTLV(value, index);
      if (!tlv) break;
      
      const { tag, length, value: subValue } = tlv;
      
      // Validate the tag format
      if (!isValidTag(tag)) break;
      
      subTags.push({
        tag,
        length,
        value: subValue,
        description: getSubTagDescription(parentTag, tag)
      });
      
      index += 4 + length;
    }
    
    // Only return sub-tags if we've parsed the entire value successfully
    if (index === value.length && subTags.length > 0) {
      return subTags;
    }
    
  } catch (error) {
    return undefined;
  }

  return undefined;
};

/**
 * Get description for a sub-tag
 */
const getSubTagDescription = (parentTag: string, subTag: string): string => {
  const parentDescriptions = SUB_TAG_DESCRIPTIONS[parentTag];
  if (parentDescriptions?.[subTag]) {
    return parentDescriptions[subTag];
  }

  return GENERIC_SUB_TAG_DESCRIPTIONS[subTag] || `Sub-tag ${subTag}`;
};

/**
 * Get description for a field tag
 */
const getFieldDescription = (tag: string): string => {
  return FIELD_DESCRIPTIONS[tag] || `Unknown field (${tag})`;
};