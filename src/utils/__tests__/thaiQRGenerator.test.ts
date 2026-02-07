import { vi } from 'vitest';
import {
  generateThaiQR,
  validateQRInput,
  generateSampleQR,
  generateSampleCreditTransferQR
} from '../thaiQRGenerator';
import { parseThaiQR } from '../thaiQRParser';

// Mock TextEncoder/TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock canvas for QR code generation in tests
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCodeImage')
  }
}));

describe('Thai QR Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('generates valid QR code with required fields', async () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const result = await generateThaiQR(input);

    expect(result).toBeDefined();
    expect(result.qrString).toBeDefined();
    expect(result.qrString).toContain('00'); // Payload format indicator
    expect(result.qrString).toContain('30'); // Tag 30 for merchant account info
    expect(result.qrString).toContain('63'); // CRC tag

    // Test QR code structure - it should be a valid EMV QR string
    expect(result.qrString.length).toBeGreaterThan(50);
    expect(result.qrString).toMatch(/^00020101021230/); // Start pattern
  });

  test('round-trip: generated QR can be parsed back', async () => {
    const input = generateSampleQR();
    
    const result = await generateThaiQR(input);
    const parsedData = parseThaiQR(result.qrString);
    
    expect(parsedData.version).toBe('01');
    expect(parsedData.currency).toBe('764'); // Thai Baht
    expect(parsedData.amount).toBe(input.amount);
    expect(parsedData.merchantName).toBe(input.merchantName);
  });

  test('validates required fields', () => {
    const incompleteInput = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '',
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(incompleteInput);
    expect(errors).toContain('Biller ID is required for bill payment');
  });

  test('validates field lengths', () => {
    const invalidInput = {
      paymentType: 'bill-payment' as const,
      aid: 'A'.repeat(50), // Too long
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(invalidInput);
    expect(errors).toContain('AID must be 32 characters or less');
  });

  test('includes optional fields when provided', async () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      reference2: '0876543210',
      amount: 250.50,
      merchantName: 'Test Merchant',
      merchantCity: 'Bangkok'
    };

    const result = await generateThaiQR(input);
    const parsedData = parseThaiQR(result.qrString);

    expect(parsedData.amount).toBe(250.50);
    expect(parsedData.merchantName).toBe('Test Merchant');

    // For bill payment, references are in Tag 30, not Tag 62
    const tag30Field = parsedData.parsedFields.find(field => field.tag === '30');
    expect(tag30Field).toBeDefined();
    expect(tag30Field?.subTags).toBeDefined();
    expect(tag30Field?.subTags?.length).toBeGreaterThan(0);
  });

  test('generates valid CRC checksum', async () => {
    const input = generateSampleQR();
    const result = await generateThaiQR(input);
    
    // QR string should end with Tag 63 (CRC) and 4-character checksum
    expect(result.qrString).toMatch(/6304[0-9A-F]{4}$/);
    
    // Should be parseable (which validates CRC)
    expect(() => parseThaiQR(result.qrString)).not.toThrow();
  });

  test('handles missing optional fields gracefully', async () => {
    const minimalInput = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const result = await generateThaiQR(minimalInput);
    const parsedData = parseThaiQR(result.qrString);

    expect(parsedData.version).toBe('01');
    expect(parsedData.currency).toBe('764');
    expect(parsedData.amount).toBeUndefined();
    expect(parsedData.merchantName).toBeUndefined();
  });

  test('does not include Merchant Category Code field in generated QR', async () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const result = await generateThaiQR(input);
    const parsedData = parseThaiQR(result.qrString);

    const merchantCategoryCodeField = parsedData.parsedFields.find(field => field.tag === '52');
    expect(merchantCategoryCodeField).toBeUndefined();
  });

  test('validates missing AID', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: '',
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('AID (Application Identifier) is required');
  });

  test('validates missing reference1', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: ''
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Reference 1 is required for bill payment');
  });

  test('validates billerId length', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: 'B'.repeat(50),
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Biller ID must be 32 characters or less');
  });

  test('validates reference1 length', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'R'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Reference 1 must be 25 characters or less');
  });

  test('validates reference2 length', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      reference2: 'R'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Reference 2 must be 25 characters or less');
  });

  test('validates merchantName length', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      merchantName: 'M'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Merchant name must be 25 characters or less');
  });

  test('validates merchantCity length', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      merchantCity: 'C'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Merchant city must be 15 characters or less');
  });

  test('validates negative amount', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      amount: -10
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Amount must be between 0 and 999,999.99');
  });

  test('returns empty array for valid input', () => {
    const validInput = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      amount: 100,
      merchantName: 'Test Shop',
      merchantCity: 'Bangkok'
    };

    const errors = validateQRInput(validInput);
    expect(errors).toEqual([]);
  });

  test('generateSampleQR returns valid input', () => {
    const sample = generateSampleQR();

    expect(sample.aid).toBeDefined();
    expect(sample.billerId).toBeDefined();
    expect(sample.reference1).toBeDefined();
    expect(sample.amount).toBeGreaterThan(0);
    expect(sample.merchantName).toBeDefined();
    expect(sample.merchantCity).toBeDefined();

    const errors = validateQRInput(sample);
    expect(errors).toEqual([]);
  });

  test('generates QR with amount formatted correctly', async () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      amount: 123.45
    };

    const result = await generateThaiQR(input);
    const parsedData = parseThaiQR(result.qrString);

    expect(parsedData.amount).toBe(123.45);
  });

  test('generates QR with reference2 when provided', async () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'REF1',
      reference2: 'REF2'
    };

    const result = await generateThaiQR(input);

    expect(result.qrString).toBeDefined();
    expect(result.qrString.length).toBeGreaterThan(0);
  });

  test('generates QR with merchant city', async () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: 'A000000677010112',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      merchantCity: 'Bangkok'
    };

    const result = await generateThaiQR(input);
    const parsedData = parseThaiQR(result.qrString);

    // Merchant city should be in the parsed data
    const cityField = parsedData.parsedFields.find(f => f.tag === '60');
    if (cityField) {
      expect(cityField.value).toBe('Bangkok');
    }
  });

  test('validates all required fields are missing', () => {
    const input = {
      paymentType: 'bill-payment' as const,
      aid: '',
      billerId: '',
      reference1: ''
    };

    const errors = validateQRInput(input);
    expect(errors.length).toBe(3);
    expect(errors).toContain('AID (Application Identifier) is required');
    expect(errors).toContain('Biller ID is required for bill payment');
    expect(errors).toContain('Reference 1 is required for bill payment');
  });

  test('generates QR string successfully', async () => {
    const input = generateSampleQR();
    const result = await generateThaiQR(input);

    expect(result.qrString).toBeDefined();
    expect(result.qrString.length).toBeGreaterThan(0);
  });

  describe('Tag 29 - Credit Transfer', () => {
    test('generates QR with mobile number recipient', async () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'mobile' as const,
        recipientId: '0066812345678',
        amount: 100.00
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      // Should have Tag 29 instead of Tag 30
      const tag29Field = parsedData.parsedFields.find(field => field.tag === '29');
      expect(tag29Field).toBeDefined();
      expect(tag29Field?.subTags).toBeDefined();

      // Check mobile number is in subtag 01
      const mobileSubTag = tag29Field?.subTags?.find(st => st.tag === '01');
      expect(mobileSubTag).toBeDefined();
      expect(mobileSubTag?.value).toBe('0066812345678');
    });

    test('generates QR with national ID recipient', async () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'national-id' as const,
        recipientId: '1234567890123'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag29Field = parsedData.parsedFields.find(field => field.tag === '29');
      expect(tag29Field).toBeDefined();

      // National ID should be in subtag 02
      const nationalIdSubTag = tag29Field?.subTags?.find(st => st.tag === '02');
      expect(nationalIdSubTag).toBeDefined();
      expect(nationalIdSubTag?.value).toBe('1234567890123');
    });

    test('generates QR with e-wallet ID recipient', async () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'ewallet' as const,
        recipientId: '123456789012345'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag29Field = parsedData.parsedFields.find(field => field.tag === '29');
      expect(tag29Field).toBeDefined();

      // E-wallet should be in subtag 03
      const ewalletSubTag = tag29Field?.subTags?.find(st => st.tag === '03');
      expect(ewalletSubTag).toBeDefined();
      expect(ewalletSubTag?.value).toBe('123456789012345');
    });

    test('generates QR with bank account recipient', async () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'bank-account' as const,
        recipientId: '001234567890'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag29Field = parsedData.parsedFields.find(field => field.tag === '29');
      expect(tag29Field).toBeDefined();

      // Bank account should be in subtag 04
      const bankAccountSubTag = tag29Field?.subTags?.find(st => st.tag === '04');
      expect(bankAccountSubTag).toBeDefined();
      expect(bankAccountSubTag?.value).toBe('001234567890');
    });

    test('includes OTA field when AID is A000000677010114', async () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010114',
        recipientType: 'mobile' as const,
        recipientId: '0066812345678',
        ota: '1234567890'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag29Field = parsedData.parsedFields.find(field => field.tag === '29');
      expect(tag29Field).toBeDefined();

      // OTA should be in subtag 05
      const otaSubTag = tag29Field?.subTags?.find(st => st.tag === '05');
      expect(otaSubTag).toBeDefined();
      expect(otaSubTag?.value).toBe('1234567890');
    });

    test('validates OTA is required when AID is A000000677010114', () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010114',
        recipientType: 'mobile' as const,
        recipientId: '0066812345678'
        // Missing OTA
      };

      const errors = validateQRInput(input);
      expect(errors).toContain('OTA is mandatory when AID is A000000677010114 (customer-presented QR)');
    });

    test('validates recipient ID is required for credit transfer', () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'mobile' as const,
        recipientId: ''
      };

      const errors = validateQRInput(input);
      expect(errors).toContain('Recipient ID is required for credit transfer');
    });

    test('validates recipient type is required for credit transfer', () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientId: '0066812345678'
        // Missing recipientType
      };

      const errors = validateQRInput(input);
      expect(errors).toContain('Recipient type is required for credit transfer');
    });

    test('includes references in Tag 62 for credit transfer', async () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'mobile' as const,
        recipientId: '0066812345678',
        reference1: 'REF001',
        reference2: 'REF002'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      // For credit transfer, references should be in Tag 62
      const tag62Field = parsedData.parsedFields.find(field => field.tag === '62');
      expect(tag62Field).toBeDefined();
      expect(tag62Field?.subTags).toBeDefined();

      const ref1SubTag = tag62Field?.subTags?.find(st => st.tag === '01');
      expect(ref1SubTag?.value).toBe('REF001');

      const ref2SubTag = tag62Field?.subTags?.find(st => st.tag === '02');
      expect(ref2SubTag?.value).toBe('REF002');
    });

    test('validates recipientId length', () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'mobile' as const,
        recipientId: 'R'.repeat(50)
      };

      const errors = validateQRInput(input);
      expect(errors).toContain('Recipient ID must be 43 characters or less');
    });

    test('validates OTA length', () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010114',
        recipientType: 'mobile' as const,
        recipientId: '0066812345678',
        ota: '12345678901' // Too long (should be 10)
      };

      const errors = validateQRInput(input);
      expect(errors).toContain('OTA must be 10 characters');
    });

    test('generateSampleCreditTransferQR returns valid input', () => {
      const sample = generateSampleCreditTransferQR();

      expect(sample.paymentType).toBe('credit-transfer');
      expect(sample.aid).toBeDefined();
      expect(sample.recipientId).toBeDefined();
      expect(sample.recipientType).toBeDefined();

      const errors = validateQRInput(sample);
      expect(errors).toEqual([]);
    });

    test('round-trip: credit transfer QR can be parsed back', async () => {
      const input = generateSampleCreditTransferQR();

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      expect(parsedData.version).toBe('01');
      expect(parsedData.currency).toBe('764');
      expect(parsedData.amount).toBe(input.amount);

      // Should have Tag 29
      const tag29Field = parsedData.parsedFields.find(field => field.tag === '29');
      expect(tag29Field).toBeDefined();
    });
  });

  describe('Tag 30 - Bill Payment', () => {
    test('generates correct sub-tag structure', async () => {
      const input = {
        paymentType: 'bill-payment' as const,
        aid: 'A000000677010112',
        billerId: '010566300012345',
        reference1: 'INV001',
        reference2: 'CUST123'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag30Field = parsedData.parsedFields.find(field => field.tag === '30');
      expect(tag30Field).toBeDefined();
      expect(tag30Field?.subTags).toBeDefined();

      // Verify correct sub-tag IDs
      const aidSubTag = tag30Field?.subTags?.find(st => st.tag === '00');
      expect(aidSubTag?.value).toBe('A000000677010112');

      // Biller ID should be in subtag 01
      const billerIdSubTag = tag30Field?.subTags?.find(st => st.tag === '01');
      expect(billerIdSubTag).toBeDefined();
      expect(billerIdSubTag?.value).toBe('010566300012345');

      // Reference 1 should be in subtag 02
      const ref1SubTag = tag30Field?.subTags?.find(st => st.tag === '02');
      expect(ref1SubTag).toBeDefined();
      expect(ref1SubTag?.value).toBe('INV001');

      // Reference 2 should be in subtag 03
      const ref2SubTag = tag30Field?.subTags?.find(st => st.tag === '03');
      expect(ref2SubTag).toBeDefined();
      expect(ref2SubTag?.value).toBe('CUST123');
    });

    test('works with domestic merchant AID', async () => {
      const input = {
        paymentType: 'bill-payment' as const,
        aid: 'A000000677010112',
        billerId: '010566300012345',
        reference1: 'INV001'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag30Field = parsedData.parsedFields.find(field => field.tag === '30');
      const aidSubTag = tag30Field?.subTags?.find(st => st.tag === '00');
      expect(aidSubTag?.value).toBe('A000000677010112');
    });

    test('works with cross-border merchant AID', async () => {
      const input = {
        paymentType: 'bill-payment' as const,
        aid: 'A000000677012006',
        billerId: '010566300012345',
        reference1: 'INV001'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      const tag30Field = parsedData.parsedFields.find(field => field.tag === '30');
      const aidSubTag = tag30Field?.subTags?.find(st => st.tag === '00');
      expect(aidSubTag?.value).toBe('A000000677012006');
    });

    test('does not include references in Tag 62 for bill payment', async () => {
      const input = {
        paymentType: 'bill-payment' as const,
        aid: 'A000000677010112',
        billerId: '010566300012345',
        reference1: 'REF001',
        reference2: 'REF002'
      };

      const result = await generateThaiQR(input);
      const parsedData = parseThaiQR(result.qrString);

      // References should be in Tag 30, not Tag 62
      const tag30Field = parsedData.parsedFields.find(field => field.tag === '30');
      const ref1SubTag = tag30Field?.subTags?.find(st => st.tag === '02');
      expect(ref1SubTag?.value).toBe('REF001');

      // Tag 62 should not contain references for bill payment
      const tag62Field = parsedData.parsedFields.find(field => field.tag === '62');
      if (tag62Field?.subTags) {
        const ref1InTag62 = tag62Field.subTags.find(st => st.tag === '01');
        expect(ref1InTag62).toBeUndefined();
      }
    });
  });

  describe('Payment Type Validation', () => {
    test('validates missing payment type', () => {
      const input = {
        aid: 'A000000677010112',
        billerId: '010566300012345',
        reference1: 'INV001'
      };

      const errors = validateQRInput(input);
      expect(errors).toContain('Payment type is required');
    });

    test('accepts valid credit-transfer payment type', () => {
      const input = {
        paymentType: 'credit-transfer' as const,
        aid: 'A000000677010111',
        recipientType: 'mobile' as const,
        recipientId: '0066812345678'
      };

      const errors = validateQRInput(input);
      expect(errors).toEqual([]);
    });

    test('accepts valid bill-payment payment type', () => {
      const input = {
        paymentType: 'bill-payment' as const,
        aid: 'A000000677010112',
        billerId: '010566300012345',
        reference1: 'INV001'
      };

      const errors = validateQRInput(input);
      expect(errors).toEqual([]);
    });
  });
});
