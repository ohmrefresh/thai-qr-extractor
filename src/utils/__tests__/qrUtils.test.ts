import { describe, it, expect } from 'vitest';
import { calculateCRC16, formatTLV } from '../qrUtils';

describe('calculateCRC16', () => {
  it('should calculate CRC16-CCITT for a known QR string', () => {
    const testData = '00020101021130570016A00000067701011201150105663000123450202INV20240010310087654321053037645802TH5915Sample Merchant6007Bangkok62150201INV20240010302106304';
    const result = calculateCRC16(testData);
    expect(result).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should return 4-character uppercase hex string', () => {
    const result = calculateCRC16('test');
    expect(result).toHaveLength(4);
    expect(result).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should produce consistent results', () => {
    const result1 = calculateCRC16('hello');
    const result2 = calculateCRC16('hello');
    expect(result1).toBe(result2);
  });

  it('should produce different results for different inputs', () => {
    const result1 = calculateCRC16('hello');
    const result2 = calculateCRC16('world');
    expect(result1).not.toBe(result2);
  });
});

describe('formatTLV', () => {
  it('should format tag-length-value with zero-padded length', () => {
    expect(formatTLV('00', '01')).toBe('000201');
  });

  it('should handle longer values', () => {
    expect(formatTLV('29', 'A000000677010111')).toBe('2916A000000677010111');
  });

  it('should handle empty value', () => {
    expect(formatTLV('00', '')).toBe('0000');
  });

  it('should handle double-digit length', () => {
    const value = 'A'.repeat(20);
    expect(formatTLV('29', value)).toBe(`2920${'A'.repeat(20)}`);
  });
});
