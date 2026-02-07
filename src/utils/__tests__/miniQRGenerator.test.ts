import { describe, it, expect } from 'vitest';
import { generateMiniQR, validateMiniQRInput } from '../miniQRGenerator';

describe('Mini QR Generator', () => {
  describe('generateMiniQR', () => {
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

    it('should throw error for invalid bank code', async () => {
      await expect(
        generateMiniQR({
          bankCode: '12', // Only 2 digits
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
  });

  describe('validateMiniQRInput', () => {
    it('should return no errors for valid input', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'TEST123'
      });

      expect(errors).toHaveLength(0);
    });

    it('should return error for missing bank code', () => {
      const errors = validateMiniQRInput({
        bankCode: '',
        transactionId: 'TEST123'
      });

      expect(errors).toContain('Bank code is required');
    });

    it('should return error for invalid bank code length', () => {
      const errors = validateMiniQRInput({
        bankCode: '12',
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

    it('should return error for missing transaction ID', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: ''
      });

      expect(errors).toContain('Transaction ID is required');
    });

    it('should return error for transaction ID exceeding 50 characters', () => {
      const errors = validateMiniQRInput({
        bankCode: '014',
        transactionId: 'A'.repeat(51)
      });

      expect(errors).toContain('Transaction ID must be 50 characters or less');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const errors = validateMiniQRInput({
        bankCode: '',
        transactionId: ''
      });

      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Bank code is required');
      expect(errors).toContain('Transaction ID is required');
    });
  });
});
