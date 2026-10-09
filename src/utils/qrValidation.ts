import { ThaiQRData, QRField } from './thaiQRParser';
import { calculateCRC16 } from './qrUtils';

export type QRIssueCode =
  | 'crc-missing'
  | 'crc-mismatch'
  | 'crc-not-last'
  | 'unparsed-data'
  | 'payload-format'
  | 'malformed-template'
  | 'missing-subtag';

export interface QRValidationIssue {
  code: QRIssueCode;
  severity: 'error' | 'warning';
  message: string;
  tag?: string;
  subTag?: string;
  /** Character offset in rawData, for issues not tied to a tag */
  offset?: number;
}

export interface QRValidationResult {
  isValid: boolean;
  issues: QRValidationIssue[];
  /** Present when a CRC field (Tag 63, or Tag 91 for Mini QR) was found */
  crc?: {
    tag: string;
    actual: string;
    expected: string;
  };
}

const CUSTOMER_PRESENTED_AID = 'A000000677010114';

// Templates whose value must itself be TLV-encoded sub-tags
const TEMPLATE_TAGS = ['29', '30', '62'];

const RECIPIENT_SUB_TAGS = ['01', '02', '03', '04'];

/**
 * Check a parsed payload against the EMV / PromptPay structural rules:
 * CRC, unparsed data, payload format indicator and mandatory sub-tags.
 * Derived from rawData + parsedFields so it also works for history entries.
 */
export const validateThaiQR = (data: ThaiQRData): QRValidationResult => {
  const issues: QRValidationIssue[] = [];
  const fields = data.parsedFields;

  const offsets: number[] = [];
  let consumed = 0;
  for (const field of fields) {
    offsets.push(consumed);
    consumed += 4 + field.length;
  }

  // Mini QR carries its CRC in Tag 91 and has no payload format indicator
  const isMiniQR = !fields.some(f => f.tag === '63') && fields.some(f => f.tag === '91');
  const crcTag = isMiniQR ? '91' : '63';

  if (consumed < data.rawData.length) {
    const tail = data.rawData.slice(consumed);
    const preview = tail.length > 12 ? `${tail.slice(0, 12)}…` : tail;
    issues.push({
      code: 'unparsed-data',
      severity: 'error',
      offset: consumed,
      message: `${tail.length} character${tail.length === 1 ? '' : 's'} at offset ${consumed} could not be read as TLV ("${preview}").`
    });
  }

  if (!isMiniQR) {
    const first = fields[0];
    if (!first || first.tag !== '00' || first.value !== '01') {
      issues.push({
        code: 'payload-format',
        severity: 'error',
        tag: '00',
        message: first?.tag === '00'
          ? `Payload Format Indicator (Tag 00) is "${first.value}"; it must be "01".`
          : 'Payload Format Indicator (Tag 00 = "01") must be the first field.'
      });
    }
  }

  let crc: QRValidationResult['crc'];
  const crcIndex = fields.findIndex(f => f.tag === crcTag);
  if (crcIndex === -1) {
    issues.push({
      code: 'crc-missing',
      severity: 'error',
      tag: crcTag,
      message: `No CRC field (Tag ${crcTag}). A complete payload ends with ${crcTag}04 followed by 4 hex digits.`
    });
  } else {
    const crcField = fields[crcIndex];
    const expected = calculateCRC16(data.rawData.slice(0, offsets[crcIndex] + 4));
    const actual = crcField.value.toUpperCase();
    crc = { tag: crcTag, actual, expected };

    if (actual !== expected) {
      issues.push({
        code: 'crc-mismatch',
        severity: 'error',
        tag: crcTag,
        message: `CRC is ${actual || '(empty)'} but the payload computes to ${expected}. The data was altered or the checksum is wrong.`
      });
    }

    const following = fields.length - 1 - crcIndex;
    if (following > 0) {
      issues.push({
        code: 'crc-not-last',
        severity: 'error',
        tag: crcTag,
        message: `CRC (Tag ${crcTag}) must be the last field, but ${following} field${following === 1 ? '' : 's'} follow it and are not covered by the checksum.`
      });
    }
  }

  for (const field of fields) {
    issues.push(...validateTemplate(field));
  }

  return {
    isValid: !issues.some(issue => issue.severity === 'error'),
    issues,
    crc
  };
};

const validateTemplate = (field: QRField): QRValidationIssue[] => {
  if (!TEMPLATE_TAGS.includes(field.tag)) return [];

  if (!field.subTags) {
    return [{
      code: 'malformed-template',
      severity: 'error',
      tag: field.tag,
      message: `Tag ${field.tag} should contain nested sub-tags, but its value is not valid TLV.`
    }];
  }

  const present = new Set(field.subTags.map(st => st.tag));
  const missing = (subTag: string, message: string): QRValidationIssue => ({
    code: 'missing-subtag',
    severity: 'error',
    tag: field.tag,
    subTag,
    message
  });
  const issues: QRValidationIssue[] = [];

  if (field.tag === '29' || field.tag === '30') {
    if (!present.has('00')) {
      issues.push(missing('00', `Tag ${field.tag} is missing sub-tag 00 (Application ID).`));
    }
  }

  if (field.tag === '29') {
    if (!RECIPIENT_SUB_TAGS.some(st => present.has(st))) {
      issues.push(missing('01', 'Tag 29 has no recipient: expected one of sub-tags 01 (Mobile), 02 (National ID / Tax ID), 03 (E-Wallet) or 04 (Bank Account).'));
    }
    const aid = field.subTags.find(st => st.tag === '00')?.value;
    if (aid === CUSTOMER_PRESENTED_AID && !present.has('05')) {
      issues.push(missing('05', `Tag 29 is missing sub-tag 05 (OTA), which is required when the AID is ${CUSTOMER_PRESENTED_AID}.`));
    }
  }

  if (field.tag === '30') {
    if (!present.has('01')) {
      issues.push(missing('01', 'Tag 30 is missing sub-tag 01 (Biller ID).'));
    }
    if (!present.has('02')) {
      issues.push(missing('02', 'Tag 30 is missing sub-tag 02 (Reference 1).'));
    }
  }

  return issues;
};
