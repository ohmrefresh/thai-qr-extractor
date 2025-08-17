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
});