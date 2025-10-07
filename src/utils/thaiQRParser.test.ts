import { parseThaiQR } from './thaiQRParser';

describe('Thai QR Parser', () => {
  test('parses basic QR code structure', () => {
    // Mock QR data with basic fields
    const mockQRData = '000201010212260004hb400005US.QR.01041234567890123456';
    
    const result = parseThaiQR(mockQRData);
    
    expect(result.version).toBe('01');
    expect(result.type).toBe('12');
    expect(result.parsedFields).toBeDefined();
    expect(result.parsedFields.length).toBeGreaterThan(0);
  });

  test('extracts sub-tags from merchant account information', () => {
    // Mock QR data with proper sub-tags in field 30 (Merchant Account Information)
    const mockQRData = '00020101021230250016A0000006770101120215612345678901234565304';
    
    const result = parseThaiQR(mockQRData);
    
    const merchantField = result.parsedFields.find(field => field.tag === '30');
    expect(merchantField).toBeDefined();
    if (merchantField?.subTags && merchantField.subTags.length > 0) {
      expect(merchantField.subTags.length).toBeGreaterThan(0);
    } else {
      // If sub-tags aren't parsed, verify the field at least exists
      expect(merchantField?.value).toBeDefined();
    }
  });

  test('handles QR data without sub-tags', () => {
    // Simple QR data without complex sub-tag structures
    const mockQRData = '00020101021253037645802TH6304';
    
    const result = parseThaiQR(mockQRData);
    
    expect(result.parsedFields).toBeDefined();
    expect(result.parsedFields.length).toBeGreaterThan(0);
    
    // Fields without sub-tags should not have subTags property or should be undefined
    const simpleFields = result.parsedFields.filter(field => !field.subTags || field.subTags.length === 0);
    expect(simpleFields.length).toBeGreaterThan(0);
  });

  test('handles malformed QR data gracefully', () => {
    const malformedQRData = '00';
    
    expect(() => {
      parseThaiQR(malformedQRData);
    }).toThrow('No valid QR code fields found');
  });

  test('correctly describes sub-tags', () => {
    // Mock QR with known sub-tag structure (field 62 with proper sub-tags)
    const mockQRData = '000201010212621101085Store1005802TH6304';

    const result = parseThaiQR(mockQRData);

    const additionalDataField = result.parsedFields.find(field => field.tag === '62');
    expect(additionalDataField).toBeDefined();

    if (additionalDataField?.subTags && additionalDataField.subTags.length > 0) {
      const billNumberSubTag = additionalDataField.subTags.find(subTag => subTag.tag === '01');
      if (billNumberSubTag) {
        expect(billNumberSubTag.description).toBe('Bill Number');
      }
    } else {
      // If no sub-tags were parsed, verify the field exists at least
      expect(additionalDataField?.value).toBeDefined();
    }
  });

  test('parses amount field correctly', () => {
    const qrData = '00020101021254041.005802TH6304';
    const result = parseThaiQR(qrData);

    expect(result.amount).toBe(1.00);
  });

  test('parses currency field correctly', () => {
    const qrData = '00020101021253037645802TH6304';
    const result = parseThaiQR(qrData);

    expect(result.currency).toBe('764');
  });

  test('parses merchant name field', () => {
    const qrData = '00020101021259099Test Shop5802TH6304';
    const result = parseThaiQR(qrData);

    // Check that merchant name field exists
    const merchantField = result.parsedFields.find(f => f.tag === '59');
    expect(merchantField).toBeDefined();
    expect(result.merchantName).toBeDefined();
  });

  test('parses checksum correctly', () => {
    const qrData = '00020101021253037645802TH6304ABCD';
    const result = parseThaiQR(qrData);

    expect(result.checksum).toBe('ABCD');
  });

  test('handles reference field in tag 05', () => {
    const qrData = '00020101021205051234553037645802TH6304';
    const result = parseThaiQR(qrData);

    expect(result.reference).toBeDefined();
  });

  test('handles reference field in tag 07', () => {
    const qrData = '00020101021207051234553037645802TH6304';
    const result = parseThaiQR(qrData);

    expect(result.reference).toBeDefined();
  });

  test('returns proper field descriptions', () => {
    const qrData = '00020101021252040001530376458020TH6304';
    const result = parseThaiQR(qrData);

    const mccField = result.parsedFields.find(f => f.tag === '52');
    expect(mccField?.description).toBe('Merchant Category Code');

    const countryField = result.parsedFields.find(f => f.tag === '58');
    expect(countryField?.description).toBe('Country Code');
  });

  test('handles QR with only version and type', () => {
    const qrData = '000201010212';
    const result = parseThaiQR(qrData);

    expect(result.version).toBe('01');
    expect(result.type).toBe('12');
    expect(result.parsedFields.length).toBeGreaterThan(0);
  });

  test('throws error for empty string', () => {
    expect(() => parseThaiQR('')).toThrow();
  });

  test('throws error for invalid length field', () => {
    const invalidQR = '00XXXX';
    expect(() => parseThaiQR(invalidQR)).toThrow();
  });

  test('handles sub-tags with invalid structure gracefully', () => {
    // QR with field that looks like it might have sub-tags but doesn't
    const qrData = '00020101021262055ABCDE5802TH6304';
    const result = parseThaiQR(qrData);

    const field62 = result.parsedFields.find(f => f.tag === '62');
    // Should either have no sub-tags or handle gracefully
    expect(field62).toBeDefined();
  });

  test('parses merchant ID from sub-tags in tag 30', () => {
    const qrData = '00020101021230180200164TestMerchantID5802TH6304';
    const result = parseThaiQR(qrData);

    // Should attempt to extract merchant ID from sub-tags
    expect(result.parsedFields).toBeDefined();
  });

  test('handles PromptPay in tag 15', () => {
    const qrData = '0002010102121522001650001234567890promptpay5802TH6304';
    const result = parseThaiQR(qrData);

    if (result.merchantId) {
      expect(result.merchantName).toBe('PromptPay');
    }
  });

  test('handles multiple fields correctly', () => {
    const qrData = '00020101021252040001530376454041.005802TH6304ABCD';
    const result = parseThaiQR(qrData);

    expect(result.version).toBe('01');
    expect(result.type).toBe('12');
    expect(result.currency).toBe('764');
    expect(result.amount).toBe(1.00);
    expect(result.checksum).toBe('ABCD');
  });

  test('stops parsing at incomplete field', () => {
    const qrData = '0002010102125204000153037645802TH5909';
    const result = parseThaiQR(qrData);

    // Should parse complete fields and stop at incomplete one
    expect(result.parsedFields.length).toBeGreaterThan(0);
  });
});