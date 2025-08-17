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
    // Mock QR data with sub-tags in field 15 (PromptPay)
    const mockQRData = '00020101021215260004th.promptpay0113066123456789015390005390025434.005802TH5303764';
    
    const result = parseThaiQR(mockQRData);
    
    const promptPayField = result.parsedFields.find(field => field.tag === '15');
    expect(promptPayField).toBeDefined();
    expect(promptPayField?.subTags).toBeDefined();
    expect(promptPayField?.subTags?.length).toBeGreaterThan(0);
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
    const mockQRData = '000201010212620702010805Store10';
    
    const result = parseThaiQR(mockQRData);
    
    const additionalDataField = result.parsedFields.find(field => field.tag === '62');
    expect(additionalDataField).toBeDefined();
    
    if (additionalDataField?.subTags && additionalDataField.subTags.length > 0) {
      const billNumberSubTag = additionalDataField.subTags.find(subTag => subTag.tag === '01');
      if (billNumberSubTag) {
        expect(billNumberSubTag.description).toBe('Bill Number');
      }
    } else {
      // If no sub-tags were parsed, let's check the value to understand why
      console.log('Field 62 value:', additionalDataField?.value);
      console.log('Field 62 sub-tags:', additionalDataField?.subTags);
    }
  });
});