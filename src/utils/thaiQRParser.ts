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
      if (index + 4 > qrData.length) break;
      
      const tag = qrData.substr(index, 2);
      const length = parseInt(qrData.substr(index + 2, 2), 10);
      
      if (isNaN(length) || index + 4 + length > qrData.length) break;
      
      const value = qrData.substr(index + 4, length);
      
      const field: QRField = {
        tag,
        length,
        value,
        description: getFieldDescription(tag),
        subTags: parseSubTags(tag, value)
      };
      
      result.parsedFields.push(field);
      
      switch (tag) {
        case '00':
          result.version = value;
          break;
        case '01':
          result.type = value;
          break;
        case '15':
        case '29':
          if (value.includes('promptpay')) {
            result.merchantId = extractPromptPayId(value);
            result.merchantName = 'PromptPay';
          }
          break;
        case '30':
          // Handle tag 30 merchant account information
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

const extractPromptPayId = (value: string): string => {
  const parts = value.split('.');
  return parts[parts.length - 1] || value;
};

const extractMerchantId = (subTags?: QRSubTag[]): string => {
  if (!subTags) return '';
  
  // Look for merchant identifier in sub-tag 02 or 03
  const merchantSubTag = subTags.find(tag => tag.tag === '02' || tag.tag === '03');
  return merchantSubTag?.value || '';
};

const parseSubTags = (parentTag: string, value: string): QRSubTag[] | undefined => {
  // Try to parse as sub-tags if the value looks like it contains TLV structures
  if (value.length < 4) return undefined;
  
  const subTags: QRSubTag[] = [];
  let index = 0;

  try {
    while (index < value.length) {
      // Need at least 4 characters for tag(2) + length(2)
      if (index + 4 > value.length) break;
      
      const subTag = value.substr(index, 2);
      const lengthStr = value.substr(index + 2, 2);
      const subLength = parseInt(lengthStr, 10);
      
      // Validate the parsed length
      if (isNaN(subLength) || subLength < 0 || index + 4 + subLength > value.length) {
        // If this doesn't look like a valid TLV structure, break
        break;
      }
      
      // Check if tag looks valid (should be numeric)
      if (!/^\d{2}$/.test(subTag)) {
        break;
      }
      
      const subValue = value.substr(index + 4, subLength);
      
      subTags.push({
        tag: subTag,
        length: subLength,
        value: subValue,
        description: getSubTagDescription(parentTag, subTag)
      });
      
      index += 4 + subLength;
    }
    
    // Only return sub-tags if we've parsed the entire value successfully
    if (index === value.length && subTags.length > 0) {
      return subTags;
    }
    
  } catch (error) {
    // If sub-tag parsing fails, return undefined (treat as regular field)
    return undefined;
  }

  // If we couldn't parse the entire value as sub-tags, treat as regular field
  return undefined;
};

const getSubTagDescription = (parentTag: string, subTag: string): string => {
  const subTagDescriptions: { [key: string]: { [key: string]: string } } = {
    '02': { // Merchant Account Information (Visa)
      '00': 'Globally Unique Identifier',
      '01': 'Payment Network Specific',
      '02': 'Merchant Identifier',
      '03': 'Merchant Category Code',
      '04': 'Transaction Currency',
      '05': 'Transaction Amount',
      '06': 'Country Code',
      '07': 'Merchant Name',
      '08': 'Merchant City'
    },
    '03': { // Merchant Account Information (Mastercard)
      '00': 'Globally Unique Identifier',
      '01': 'Payment Network Specific',
      '02': 'Merchant Identifier',
      '03': 'Merchant Category Code',
      '04': 'Transaction Currency',
      '05': 'Transaction Amount'
    },
    '04': { // Merchant Account Information (EMV)
      '00': 'Globally Unique Identifier',
      '01': 'Payment Network Specific',
      '02': 'Merchant Identifier',
      '03': 'Merchant Category Code'
    },
    '15': { // PromptPay
      '00': 'Globally Unique Identifier',
      '01': 'Payment Network Specific',
      '02': 'Mobile Number',
      '03': 'National ID',
      '04': 'eWallet ID'
    },
    '29': { // PromptPay
      '00': 'Globally Unique Identifier',
      '01': 'Payment Network Specific',
      '02': 'Mobile Number',
      '03': 'National ID',
      '04': 'eWallet ID'
    },
    '30': { // Merchant Account Information
      '00': 'Globally Unique Identifier',
      '01': 'Payment Network Specific',
      '02': 'Merchant Identifier',
      '03': 'Merchant Category Code',
      '04': 'Transaction Type',
      '05': 'Additional Data',
      '06': 'Terminal ID',
      '07': 'Store ID',
      '08': 'Loyalty Program',
      '09': 'Merchant Category'
    },
    '62': { // Additional Data Field Template
      '01': 'Bill Number',
      '02': 'Mobile Number',
      '03': 'Store Label',
      '04': 'Loyalty Number',
      '05': 'Reference Label',
      '06': 'Customer Label',
      '07': 'Terminal Label',
      '08': 'Purpose of Transaction',
      '09': 'Additional Consumer Data Request',
      '10': 'Merchant Tax ID',
      '11': 'Merchant Channel'
    },
    '64': { // Merchant Information - Language Template
      '00': 'Language Preference',
      '01': 'Merchant Name - Alternate Language',
      '02': 'Merchant City - Alternate Language'
    },
    '80': { // Unreserved Templates
      '00': 'Globally Unique Identifier',
      '01': 'Context Specific Data',
      '02': 'Context Specific Data',
      '03': 'Context Specific Data'
    },
    '81': { // Unreserved Templates
      '00': 'Globally Unique Identifier',
      '01': 'Context Specific Data'
    }
  };

  const parentDescriptions = subTagDescriptions[parentTag];
  if (parentDescriptions && parentDescriptions[subTag]) {
    return parentDescriptions[subTag];
  }

  // Generic sub-tag descriptions based on common EMV patterns
  const genericDescriptions: { [key: string]: string } = {
    '00': 'Globally Unique Identifier',
    '01': 'Payment Network Specific / Context Data',
    '02': 'Merchant/Account Identifier',
    '03': 'Category/Classification Code',
    '04': 'Transaction Type/Currency',
    '05': 'Amount/Reference Data',
    '06': 'Country/Terminal Code',
    '07': 'Name/Location Data',
    '08': 'City/Additional Info',
    '09': 'Additional Consumer Data',
    '10': 'Reserved Data Element',
    '11': 'Reserved Data Element',
    '12': 'Reserved Data Element',
    '13': 'Reserved Data Element',
    '14': 'Reserved Data Element',
    '15': 'Reserved Data Element',
    '16': 'Reserved Data Element',
    '17': 'Reserved Data Element',
    '18': 'Reserved Data Element',
    '19': 'Reserved Data Element',
    '20': 'Reserved Data Element'
  };

  return genericDescriptions[subTag] || `Sub-tag ${subTag}`;
};

const getFieldDescription = (tag: string): string => {
  const descriptions: { [key: string]: string } = {
    '00': 'Payload Format Indicator',
    '01': 'Point of Initiation Method',
    '02': 'Merchant Account Information (Visa)',
    '03': 'Merchant Account Information (Mastercard)',
    '04': 'Merchant Account Information (EMV)',
    '05': 'Merchant Account Information (Discover)',
    '06': 'Merchant Account Information (JCB)',
    '07': 'Merchant Account Information (Union Pay)',
    '08': 'Merchant Account Information (American Express)',
    '09': 'Merchant Account Information',
    '10': 'Merchant Account Information',
    '11': 'Merchant Account Information',
    '12': 'Merchant Account Information',
    '13': 'Merchant Account Information',
    '14': 'Merchant Account Information',
    '15': 'Merchant Account Information (PromptPay)',
    '29': 'Merchant Account Information (PromptPay)',
    '30': 'Merchant Account Information',
    '52': 'Merchant Category Code',
    '53': 'Transaction Currency',
    '54': 'Transaction Amount',
    '55': 'Tip or Convenience Indicator',
    '56': 'Value of Convenience Fee Fixed',
    '57': 'Value of Convenience Fee Percentage',
    '58': 'Country Code',
    '59': 'Merchant Name',
    '60': 'Merchant City',
    '61': 'Postal Code',
    '62': 'Additional Data Field Template',
    '63': 'CRC',
    '64': 'Merchant Information - Language Template',
    '65': 'RFU for EMVCo',
    '80': 'Unreserved Templates',
    '81': 'Unreserved Templates',
    '82': 'Unreserved Templates',
    '83': 'Unreserved Templates',
    '84': 'Unreserved Templates',
    '85': 'Unreserved Templates',
    '86': 'Unreserved Templates',
    '87': 'Unreserved Templates',
    '88': 'Unreserved Templates',
    '89': 'Unreserved Templates',
    '90': 'Unreserved Templates',
    '91': 'Unreserved Templates',
    '92': 'Unreserved Templates',
    '93': 'Unreserved Templates',
    '94': 'Unreserved Templates',
    '95': 'Unreserved Templates',
    '96': 'Unreserved Templates',
    '97': 'Unreserved Templates',
    '98': 'Unreserved Templates',
    '99': 'Unreserved Templates'
  };
  
  return descriptions[tag] || `Unknown field (${tag})`;
};