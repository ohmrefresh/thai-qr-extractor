import { describe, it, expect } from 'vitest';
import { generateMiniQR, validateMiniQRInput } from '../miniQRGenerator';

describe('Mini QR Generator', () => {
  describe('generateMiniQR - Basic Functionality', () => {
    it('should generate a valid Mini QR code with correct structure', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: '202602078Buvov9xGKBPqxhso',
        countryCode: 'TH'
      });

      expect(result).toHaveProperty('qrString');
      expect(result).toHaveProperty('qrCodeDataURL');
      expect(result).toHaveProperty('bankCode', '014');
      expect(result).toHaveProperty('transactionId', '202602078Buvov9xGKBPqxhso');
      expect(result).toHaveProperty('checksum');
    });

    it('should have exactly one occurrence of "9104" (Tag 91 Length 04) in the final string', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'TH'
      });

      // Count occurrences of "9104" (Tag 91, Length 04)
      const count = (result.qrString.match(/9104/g) || []).length;

      // Should appear exactly once (tag + length before CRC value)
      expect(count).toBe(1);

      // Verify the string ends with 9104 + 4-character CRC
      expect(result.qrString).toMatch(/9104[0-9A-F]{4}$/);
    });

    it('should calculate CRC correctly', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'TH'
      });

      // Extract CRC from the end (last 4 characters)
      const crcFromString = result.qrString.slice(-4);

      // CRC should be 4 hexadecimal characters
      expect(crcFromString).toMatch(/^[0-9A-F]{4}$/);

      // Verify checksum matches the CRC in the string
      expect(result.checksum).toBe(crcFromString);
    });

    it('should use default country code TH when not provided', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      // The string should contain Tag 51 (country code) with value "TH"
      expect(result.qrString).toContain('5102TH');
    });

    it('should generate QR code data URL', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      expect(result.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('generateMiniQR - TLV Structure Validation', () => {
    it('should encode Tag 00 with correct sub-tags structure', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'TH'
      });

      // Tag 00 should contain:
      // - Sub-tag 00: Payload Format Indicator (0006000001)
      // - Sub-tag 01: Bank Code (0103014)
      // - Sub-tag 02: Transaction ID (0207TEST123)
      expect(result.qrString).toContain('0006000001'); // Sub-tag 00
      expect(result.qrString).toContain('0103014');    // Sub-tag 01
      expect(result.qrString).toContain('0207TEST123'); // Sub-tag 02
    });

    it('should encode Tag 51 (Country Code) correctly', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'US'
      });

      // Tag 51, Length 02, Value "US"
      expect(result.qrString).toContain('5102US');
    });

    it('should encode Tag 91 (CRC) with correct TLV format', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      // Tag 91, Length 04, followed by 4-char CRC
      expect(result.qrString).toMatch(/9104[0-9A-F]{4}$/);
    });

    it('should calculate correct Tag 00 length based on sub-tags', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'A', // Single char
        countryCode: 'TH'
      });

      // Sub-tags total:
      // 0006000001 (10 chars) + 0103014 (7 chars) + 0201A (5 chars) = 22 chars
      // Tag 00 should be: 0022 + 22 chars of sub-tags
      expect(result.qrString).toMatch(/^00220006000001/);
    });

    it('should handle variable-length transaction IDs in TLV encoding', async () => {
      const shortResult = await generateMiniQR({
        bankCode: '014',
        transactionId: 'X'
      });

      const longResult = await generateMiniQR({
        bankCode: '014',
        transactionId: 'A'.repeat(50)
      });

      // Short ID: 0201X
      expect(shortResult.qrString).toContain('0201X');

      // Long ID: 0250 + 50 A's
      expect(longResult.qrString).toContain('0250' + 'A'.repeat(50));
    });
  });

  describe('generateMiniQR - Bank Code Variations', () => {
    const thaiMajorBankCodes = [
      '002', // Bangkok Bank
      '004', // Kasikornbank
      '006', // Krung Thai Bank
      '011', // TMB Bank
      '014', // Siam Commercial Bank
      '025', // Bank of Ayudhya
      '030', // Government Savings Bank
      '034', // Bank for Agriculture
      '065', // Thanachart Bank
      '069', // Kiatnakin Bank
    ];

    thaiMajorBankCodes.forEach(bankCode => {
      it(`should generate valid QR for bank code ${bankCode}`, async () => {
        const result = await generateMiniQR({
          bankCode,
          transactionId: 'TEST123'
        });

        expect(result.bankCode).toBe(bankCode);
        expect(result.qrString).toContain(`0103${bankCode}`);
        expect(result.qrString).toMatch(/9104[0-9A-F]{4}$/);
      });
    });

    it('should handle edge case bank code 000', async () => {
      const result = await generateMiniQR({
        bankCode: '000',
        transactionId: 'TEST'
      });

      expect(result.qrString).toContain('0103000');
    });

    it('should handle edge case bank code 999', async () => {
      const result = await generateMiniQR({
        bankCode: '999',
        transactionId: 'TEST'
      });

      expect(result.qrString).toContain('0103999');
    });
  });

  describe('generateMiniQR - Transaction ID Variations', () => {
    it('should handle minimum length transaction ID (1 character)', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'X'
      });

      expect(result.transactionId).toBe('X');
      expect(result.qrString).toContain('0201X');
    });

    it('should handle maximum length transaction ID (50 characters)', async () => {
      const maxId = 'A'.repeat(50);
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: maxId
      });

      expect(result.transactionId).toBe(maxId);
      expect(result.qrString).toContain('0250' + maxId);
    });

    it('should handle numeric transaction IDs', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: '1234567890'
      });

      expect(result.qrString).toContain('02101234567890');
    });

    it('should handle alphanumeric transaction IDs', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'ABC123XYZ789'
      });

      expect(result.qrString).toContain('0212ABC123XYZ789');
    });

    it('should handle transaction IDs with special characters', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'INV-2024-001_REF'
      });

      // "INV-2024-001_REF" is 16 characters, so TLV is 0216 + value
      expect(result.qrString).toContain('0216INV-2024-001_REF');
    });

    it('should handle transaction IDs with spaces', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'ORDER 123 456'
      });

      expect(result.transactionId).toBe('ORDER 123 456');
    });

    it('should handle real-world transaction ID format', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: '202602078Buvov9xGKBPqxhso'
      });

      expect(result.transactionId).toBe('202602078Buvov9xGKBPqxhso');
      expect(result.qrString).toContain('0225202602078Buvov9xGKBPqxhso');
    });
  });

  describe('generateMiniQR - Country Code Variations', () => {
    const countryCodes = [
      { code: 'TH', name: 'Thailand' },
      { code: 'US', name: 'United States' },
      { code: 'JP', name: 'Japan' },
      { code: 'CN', name: 'China' },
      { code: 'SG', name: 'Singapore' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'GB', name: 'United Kingdom' },
    ];

    countryCodes.forEach(({ code, name }) => {
      it(`should handle country code ${code} (${name})`, async () => {
        const result = await generateMiniQR({
          bankCode: '014',
          transactionId: 'TEST123',
          countryCode: code
        });

        expect(result.qrString).toContain(`5102${code}`);
      });
    });

    it('should handle single-character country code', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST',
        countryCode: 'T'
      });

      expect(result.qrString).toContain('5101T');
    });
  });

  describe('generateMiniQR - CRC Calculation Tests', () => {
    it('should produce different CRCs for different bank codes', async () => {
      const result1 = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      const result2 = await generateMiniQR({
        bankCode: '025',
        transactionId: 'TEST123'
      });

      expect(result1.checksum).not.toBe(result2.checksum);
    });

    it('should produce different CRCs for different transaction IDs', async () => {
      const result1 = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      const result2 = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST456'
      });

      expect(result1.checksum).not.toBe(result2.checksum);
    });

    it('should produce different CRCs for different country codes', async () => {
      const result1 = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'TH'
      });

      const result2 = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'US'
      });

      expect(result1.checksum).not.toBe(result2.checksum);
    });

    it('should produce identical CRCs for identical inputs (reproducibility)', async () => {
      const input = {
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'TH'
      };

      const result1 = await generateMiniQR(input);
      const result2 = await generateMiniQR(input);

      expect(result1.checksum).toBe(result2.checksum);
      expect(result1.qrString).toBe(result2.qrString);
    });

    it('should calculate CRC over data including "9104" prefix', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST'
      });

      // The CRC should be calculated over the string ending with "9104"
      // but the final string should only contain "9104" once
      const qrWithoutCRC = result.qrString.slice(0, -4); // Remove last 4 chars (CRC value)
      expect(qrWithoutCRC).toMatch(/9104$/);
    });
  });

  describe('generateMiniQR - QR String Structure', () => {
    it('should follow the correct tag order: Tag00 -> Tag51 -> Tag91', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST'
      });

      // Find positions of each tag
      const tag00Pos = result.qrString.indexOf('00');
      const tag51Pos = result.qrString.indexOf('5102');
      const tag91Pos = result.qrString.indexOf('9104');

      // Verify order
      expect(tag00Pos).toBeLessThan(tag51Pos);
      expect(tag51Pos).toBeLessThan(tag91Pos);
      expect(tag00Pos).toBe(0); // Should start with Tag 00
    });

    it('should have correct total length', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST'
      });

      // Calculate expected length:
      // Sub-tags: 0006000001 (10) + 0103014 (7) + 0204TEST (8) = 25 chars
      // Tag 00: 00 (2) + 25 (2) + 25 chars = 29
      // Tag 51: 51 (2) + 02 (2) + TH (2) = 6
      // Tag 91: 91 (2) + 04 (2) + XXXX (4) = 8
      // Total = 29 + 6 + 8 = 43
      const expectedLength = 43;
      expect(result.qrString.length).toBe(expectedLength);
    });

    it('should contain all required components', async () => {
      const result = await generateMiniQR({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      // Must contain:
      // - Payload format indicator
      expect(result.qrString).toContain('000001');
      // - Bank code
      expect(result.qrString).toContain('014');
      // - Transaction ID
      expect(result.qrString).toContain('TEST123');
      // - Country code
      expect(result.qrString).toContain('TH');
      // - CRC (4 hex chars at end)
      expect(result.qrString).toMatch(/[0-9A-F]{4}$/);
    });
  });

  describe('generateMiniQR - Error Handling', () => {
    it('should throw error for invalid bank code', async () => {
      await expect(
        generateMiniQR({
          bankCode: '12', // Only 2 digits
          transactionId: 'TEST123'
        })
      ).rejects.toThrow('Bank code must be exactly 3 digits');
    });

    it('should throw error for bank code with 4 digits', async () => {
      await expect(
        generateMiniQR({
          bankCode: '0144',
          transactionId: 'TEST123'
        })
      ).rejects.toThrow('Bank code must be exactly 3 digits');
    });

    it('should throw error for non-numeric bank code', async () => {
      await expect(
        generateMiniQR({
          bankCode: 'ABC',
          transactionId: 'TEST123'
        })
      ).rejects.toThrow('Bank code must be exactly 3 digits');
    });

    it('should throw error for bank code with special characters', async () => {
      await expect(
        generateMiniQR({
          bankCode: '01-',
          transactionId: 'TEST123'
        })
      ).rejects.toThrow('Bank code must be exactly 3 digits');
    });

    it('should throw error for missing transaction ID', async () => {
      await expect(
        generateMiniQR({
          bankCode: '014',
          transactionId: ''
        })
      ).rejects.toThrow('Transaction ID is required');
    });

    it('should throw error for transaction ID exceeding 50 characters', async () => {
      await expect(
        generateMiniQR({
          bankCode: '014',
          transactionId: 'A'.repeat(51)
        })
      ).rejects.toThrow('Transaction ID is required and must be 50 characters or less');
    });

    it('should throw error for transaction ID with 100 characters', async () => {
      await expect(
        generateMiniQR({
          bankCode: '014',
          transactionId: 'A'.repeat(100)
        })
      ).rejects.toThrow('Transaction ID is required and must be 50 characters or less');
    });
  });

  describe('generateMiniQR - Integration & Real-World Scenarios', () => {
    it('should handle SCB bank transaction', async () => {
      const result = await generateMiniQR({
        bankCode: '014', // Siam Commercial Bank
        transactionId: '202602078Buvov9xGKBPqxhso',
        countryCode: 'TH'
      });

      expect(result.bankCode).toBe('014');
      expect(result.qrString).toContain('0103014');
      expect(result.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle Bangkok Bank transaction', async () => {
      const result = await generateMiniQR({
        bankCode: '002', // Bangkok Bank
        transactionId: 'TXN20260207ABCD1234',
        countryCode: 'TH'
      });

      expect(result.bankCode).toBe('002');
      expect(result.qrString).toContain('0103002');
    });

    it('should generate multiple QR codes in sequence', async () => {
      const transactions = [
        { bankCode: '014', transactionId: 'TXN001' },
        { bankCode: '025', transactionId: 'TXN002' },
        { bankCode: '004', transactionId: 'TXN003' },
      ];

      const results = await Promise.all(
        transactions.map(tx => generateMiniQR(tx))
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.bankCode).toBe(transactions[index].bankCode);
        expect(result.transactionId).toBe(transactions[index].transactionId);
      });

      // All should have different checksums
      const checksums = results.map(r => r.checksum);
      const uniqueChecksums = new Set(checksums);
      expect(uniqueChecksums.size).toBe(3);
    });
  });

  describe('validateMiniQRInput - Valid Inputs', () => {
    it('should return no errors for valid input with all fields', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'TEST123',
        countryCode: 'TH'
      });

      expect(errors).toHaveLength(0);
    });

    it('should return no errors for valid input without optional country code', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      expect(errors).toHaveLength(0);
    });

    it('should return no errors for minimum valid transaction ID', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'X'
      });

      expect(errors).toHaveLength(0);
    });

    it('should return no errors for maximum valid transaction ID (50 chars)', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'A'.repeat(50)
      });

      expect(errors).toHaveLength(0);
    });

    it('should return no errors for various valid bank codes', () => {
      const bankCodes = ['002', '004', '014', '025', '000', '999'];

      bankCodes.forEach(bankCode => {
        const errors = validateMiniQRInput({
          bankCode,
          transactionId: 'TEST'
        });

        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('validateMiniQRInput - Bank Code Validation', () => {
    it('should return error for missing bank code', () => {
      const errors = validateMiniQRInput({
        bankCode: '',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code is required');
    });

    it('should return error for undefined bank code', () => {
      const errors = validateMiniQRInput({
        transactionId: 'TEST123'
      } as any);

      expect(errors).toContain('Bank code is required');
    });

    it('should return error for bank code with 1 digit', () => {
      const errors = validateMiniQRInput({
        bankCode: '1',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should return error for bank code with 2 digits', () => {
      const errors = validateMiniQRInput({
        bankCode: '12',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should return error for bank code with 4 digits', () => {
      const errors = validateMiniQRInput({
        bankCode: '0144',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should return error for non-numeric bank code', () => {
      const errors = validateMiniQRInput({
        bankCode: 'ABC',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should return error for alphanumeric bank code', () => {
      const errors = validateMiniQRInput({
        bankCode: '01A',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should return error for bank code with spaces', () => {
      const errors = validateMiniQRInput({
        bankCode: '0 1',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should return error for bank code with special characters', () => {
      const errors = validateMiniQRInput({
        bankCode: '01-',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });
  });

  describe('validateMiniQRInput - Transaction ID Validation', () => {
    it('should return error for missing transaction ID', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: ''
      });

      expect(errors).toContain('Transaction ID is required');
    });

    it('should return error for undefined transaction ID', () => {
      const errors = validateMiniQRInput({
        bankCode: '014'
      } as any);

      expect(errors).toContain('Transaction ID is required');
    });

    it('should return error for transaction ID with 51 characters', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'A'.repeat(51)
      });

      expect(errors).toContain('Transaction ID must be 50 characters or less');
    });

    it('should return error for transaction ID with 100 characters', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'A'.repeat(100)
      });

      expect(errors).toContain('Transaction ID must be 50 characters or less');
    });

    it('should allow transaction ID with exactly 50 characters', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'A'.repeat(50)
      });

      expect(errors).toHaveLength(0);
    });

    it('should allow transaction ID with special characters', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'TXN-2024_001@TEST'
      });

      expect(errors).toHaveLength(0);
    });

    it('should allow transaction ID with spaces', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'ORDER 123 456'
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateMiniQRInput - Multiple Errors', () => {
    it('should return multiple errors for all invalid fields', () => {
      const errors = validateMiniQRInput({
        bankCode: '',
        transactionId: ''
      });

      expect(errors.length).toBe(2);
      expect(errors).toContain('Bank code is required');
      expect(errors).toContain('Transaction ID is required');
    });

    it('should return multiple errors for invalid formats', () => {
      const errors = validateMiniQRInput({
        bankCode: 'AB',
        transactionId: 'A'.repeat(51)
      });

      expect(errors.length).toBe(2);
      expect(errors).toContain('Bank code must be exactly 3 digits');
      expect(errors).toContain('Transaction ID must be 50 characters or less');
    });

    it('should return bank code error before transaction ID error', () => {
      const errors = validateMiniQRInput({
        bankCode: '',
        transactionId: ''
      });

      // Bank code error should come first in the array
      expect(errors[0]).toBe('Bank code is required');
      expect(errors[1]).toBe('Transaction ID is required');
    });
  });

  describe('validateMiniQRInput - Edge Cases', () => {
    it('should handle empty object input', () => {
      const errors = validateMiniQRInput({});

      expect(errors.length).toBe(2);
      expect(errors).toContain('Bank code is required');
      expect(errors).toContain('Transaction ID is required');
    });

    it('should ignore country code validation (optional field)', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'TEST',
        countryCode: 'INVALID_CODE'
      });

      // Country code is optional and not validated
      expect(errors).toHaveLength(0);
    });

    it('should validate bank code even with valid transaction ID', () => {
      const errors = validateMiniQRInput({
        bankCode: 'XXX',
        transactionId: 'VALID_TRANSACTION'
      });

      expect(errors).toContain('Bank code must be exactly 3 digits');
    });

    it('should validate transaction ID even with valid bank code', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'A'.repeat(51)
      });

      expect(errors).toContain('Transaction ID must be 50 characters or less');
    });
  });
});
