/**
 * Thai QR Code Field Descriptions
 * Based on EMV QR Code Specification for Payment Systems
 */

export const FIELD_DESCRIPTIONS: Record<string, string> = {
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
};

// Add unreserved template descriptions (80-99)
for (let i = 80; i <= 99; i++) {
  FIELD_DESCRIPTIONS[i.toString()] = 'Unreserved Templates';
}

export const SUB_TAG_DESCRIPTIONS: Record<string, Record<string, string>> = {
  '02': {
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
  '15': {
    '00': 'Globally Unique Identifier',
    '01': 'Payment Network Specific',
    '02': 'Mobile Number',
    '03': 'National ID',
    '04': 'eWallet ID'
  },
  '29': {
    '00': 'Globally Unique Identifier',
    '01': 'Payment Network Specific',
    '02': 'Mobile Number',
    '03': 'National ID',
    '04': 'eWallet ID'
  },
  '30': {
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
  '62': {
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
  '64': {
    '00': 'Language Preference',
    '01': 'Merchant Name - Alternate Language',
    '02': 'Merchant City - Alternate Language'
  }
};

export const GENERIC_SUB_TAG_DESCRIPTIONS: Record<string, string> = {
  '00': 'Globally Unique Identifier',
  '01': 'Payment Network Specific / Context Data',
  '02': 'Merchant/Account Identifier',
  '03': 'Category/Classification Code',
  '04': 'Transaction Type/Currency',
  '05': 'Amount/Reference Data',
  '06': 'Country/Terminal Code',
  '07': 'Name/Location Data',
  '08': 'City/Additional Info',
  '09': 'Additional Consumer Data'
};

export const CURRENCY_CODE_THB = '764';
export const COUNTRY_CODE_THAILAND = 'TH';
export const PAYLOAD_FORMAT_VERSION = '01';
export const POINT_OF_INITIATION_STATIC = '12';
export const DEFAULT_MERCHANT_CATEGORY = '0000';
