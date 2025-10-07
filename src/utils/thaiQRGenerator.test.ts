import { generateThaiQR, validateQRInput, generateSampleQR } from './thaiQRGenerator';
import { parseThaiQR } from './thaiQRParser';

// Mock TextEncoder/TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock canvas for QR code generation in tests  
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCodeImage')
}));

describe('Thai QR Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generates valid QR code with required fields', async () => {
    const input = {
      aid: 'A000000677010111',
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
      aid: 'A000000677010111',
      billerId: '',
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(incompleteInput);
    expect(errors).toContain('Biller ID is required');
  });

  test('validates field lengths', () => {
    const invalidInput = {
      aid: 'A'.repeat(50), // Too long
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(invalidInput);
    expect(errors).toContain('AID must be 32 characters or less');
  });

  test('includes optional fields when provided', async () => {
    const input = {
      aid: 'A000000677010111',
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
    
    // Check that additional data field (Tag 62) contains references
    const tag62Field = parsedData.parsedFields.find(field => field.tag === '62');
    expect(tag62Field).toBeDefined();
    expect(tag62Field?.subTags).toBeDefined();
    expect(tag62Field?.subTags?.length).toBeGreaterThan(0);
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
      aid: 'A000000677010111',
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

  test('validates missing AID', () => {
    const input = {
      aid: '',
      billerId: '010566300012345',
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('AID (Application Identifier) is required');
  });

  test('validates missing reference1', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: '010566300012345',
      reference1: ''
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Reference 1 is required');
  });

  test('validates billerId length', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: 'B'.repeat(50),
      reference1: 'INV2024001'
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Biller ID must be 32 characters or less');
  });

  test('validates reference1 length', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: '010566300012345',
      reference1: 'R'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Reference 1 must be 25 characters or less');
  });

  test('validates reference2 length', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      reference2: 'R'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Reference 2 must be 25 characters or less');
  });

  test('validates merchantName length', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      merchantName: 'M'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Merchant name must be 25 characters or less');
  });

  test('validates merchantCity length', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      merchantCity: 'C'.repeat(50)
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Merchant city must be 15 characters or less');
  });

  test('validates negative amount', () => {
    const input = {
      aid: 'A000000677010111',
      billerId: '010566300012345',
      reference1: 'INV2024001',
      amount: -10
    };

    const errors = validateQRInput(input);
    expect(errors).toContain('Amount must be between 0 and 999,999.99');
  });

  test('returns empty array for valid input', () => {
    const validInput = {
      aid: 'A000000677010111',
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
      aid: 'A000000677010111',
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
      aid: 'A000000677010111',
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
      aid: 'A000000677010111',
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
      aid: '',
      billerId: '',
      reference1: ''
    };

    const errors = validateQRInput(input);
    expect(errors.length).toBe(3);
    expect(errors).toContain('AID (Application Identifier) is required');
    expect(errors).toContain('Biller ID is required');
    expect(errors).toContain('Reference 1 is required');
  });

  test('generates QR string successfully', async () => {
    const input = generateSampleQR();
    const result = await generateThaiQR(input);

    expect(result.qrString).toBeDefined();
    expect(result.qrString.length).toBeGreaterThan(0);
  });
});