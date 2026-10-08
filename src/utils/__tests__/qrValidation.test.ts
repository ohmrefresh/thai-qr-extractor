import { vi } from 'vitest';
import { generateThaiQR } from '../thaiQRGenerator';
import { generateMiniQR } from '../miniQRGenerator';
import { parseThaiQR } from '../thaiQRParser';
import { calculateCRC16 } from '../qrUtils';
import { validateThaiQR } from '../qrValidation';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCodeImage')
  }
}));

const withCRC = (body: string): string => {
  const unsigned = body + '6304';
  return unsigned + calculateCRC16(unsigned);
};

const creditTransferQR = async () =>
  (await generateThaiQR({
    paymentType: 'credit-transfer',
    aid: 'A000000677010111',
    recipientType: 'mobile',
    recipientId: '0812345678',
    amount: 100
  })).qrString;

const billPaymentQR = async () =>
  (await generateThaiQR({
    paymentType: 'bill-payment',
    aid: 'A000000677010112',
    billerId: '010566300012345',
    reference1: 'INV2024001'
  })).qrString;

describe('validateThaiQR', () => {
  test('generated credit transfer payload is valid', async () => {
    const qr = await creditTransferQR();
    const result = validateThaiQR(parseThaiQR(qr));

    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.crc).toEqual({ tag: '63', actual: qr.slice(-4), expected: qr.slice(-4) });
  });

  test('generated bill payment payload is valid', async () => {
    const result = validateThaiQR(parseThaiQR(await billPaymentQR()));

    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test('generated Mini QR payload is valid and checks CRC tag 91', async () => {
    const { qrString } = await generateMiniQR({ bankCode: '014', transactionId: 'TXN123456' });
    const result = validateThaiQR(parseThaiQR(qrString));

    expect(result.isValid).toBe(true);
    expect(result.crc?.tag).toBe('91');
    expect(result.crc?.actual).toBe(result.crc?.expected);
  });

  test('reports CRC mismatch with the expected value', async () => {
    const qr = await creditTransferQR();
    const tampered = qr.slice(0, -4) + 'FFFF';
    const result = validateThaiQR(parseThaiQR(tampered));

    expect(result.isValid).toBe(false);
    expect(result.crc).toEqual({ tag: '63', actual: 'FFFF', expected: qr.slice(-4) });
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'crc-mismatch', severity: 'error', tag: '63' })
    );
  });

  test('accepts lowercase CRC hex', async () => {
    const qr = await creditTransferQR();
    const lower = qr.slice(0, -4) + qr.slice(-4).toLowerCase();

    expect(validateThaiQR(parseThaiQR(lower)).isValid).toBe(true);
  });

  test('reports missing CRC and unparsed tail for a truncated payload', async () => {
    const qr = await creditTransferQR();
    const truncated = qr.slice(0, -2);
    const result = validateThaiQR(parseThaiQR(truncated));

    expect(result.isValid).toBe(false);
    expect(result.crc).toBeUndefined();
    const codes = result.issues.map(issue => issue.code);
    expect(codes).toContain('crc-missing');
    expect(codes).toContain('unparsed-data');
    const unparsed = result.issues.find(issue => issue.code === 'unparsed-data');
    expect(unparsed?.message).toContain(`offset ${qr.length - 8}`);
    expect(unparsed?.offset).toBe(qr.length - 8);
  });

  test('reports trailing garbage after the CRC', async () => {
    const qr = await creditTransferQR();
    const result = validateThaiQR(parseThaiQR(qr + 'zz9'));

    expect(result.isValid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'unparsed-data', severity: 'error' })
    );
    expect(result.issues.find(issue => issue.code === 'unparsed-data')?.message)
      .toContain(`offset ${qr.length}`);
  });

  test('reports CRC that is not the last field', () => {
    const body = '000201010212';
    const unsigned = body + '6304';
    const crc = calculateCRC16(unsigned);
    const qr = unsigned + crc + '5802TH';
    const result = validateThaiQR(parseThaiQR(qr));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'crc-not-last', tag: '63' })
    );
  });

  test('reports wrong payload format indicator', () => {
    const result = validateThaiQR(parseThaiQR(withCRC('000202010212')));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'payload-format', tag: '00' })
    );
  });

  test('requires OTA when AID is customer-presented', async () => {
    const qr = (await generateThaiQR({
      paymentType: 'credit-transfer',
      aid: 'A000000677010114',
      recipientType: 'mobile',
      recipientId: '0812345678',
      ota: '1234567890'
    })).qrString;
    const withoutOta = qr.replace(/0510\d{10}/, '');
    expect(withoutOta).not.toBe(qr);

    // Rebuild Tag 29 length and CRC so only the OTA rule is violated
    const parsed = parseThaiQR(qr);
    const tag29 = parsed.parsedFields.find(f => f.tag === '29')!;
    const newValue = tag29.value.replace(/0510\d{10}/, '');
    const rebuilt = parsed.parsedFields
      .filter(f => f.tag !== '63')
      .map(f => f.tag === '29'
        ? `29${String(newValue.length).padStart(2, '0')}${newValue}`
        : `${f.tag}${String(f.length).padStart(2, '0')}${f.value}`)
      .join('');
    const result = validateThaiQR(parseThaiQR(withCRC(rebuilt)));

    expect(result.isValid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'missing-subtag', tag: '29', subTag: '05' })
    );
  });

  test('requires a recipient sub-tag in Tag 29', () => {
    const tag29Value = '0016A000000677010111';
    const qr = withCRC(`000201010211${'29'}${tag29Value.length}${tag29Value}5802TH5303764`);
    const result = validateThaiQR(parseThaiQR(qr));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'missing-subtag', tag: '29' })
    );
  });

  test('requires Biller ID and Reference 1 in Tag 30', () => {
    const tag30Value = '0016A000000677010112';
    const qr = withCRC(`000201010211${'30'}${tag30Value.length}${tag30Value}5802TH5303764`);
    const result = validateThaiQR(parseThaiQR(qr));
    const missing = result.issues
      .filter(issue => issue.code === 'missing-subtag' && issue.tag === '30')
      .map(issue => issue.subTag);

    expect(missing).toEqual(['01', '02']);
  });

  test('reports a merchant template whose value is not valid TLV', () => {
    const qr = withCRC('000201010211' + '2905ABCDE' + '5802TH');
    const result = validateThaiQR(parseThaiQR(qr));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'malformed-template', tag: '29' })
    );
  });
});

describe('parseThaiQR sub-tag labels match the generator', () => {
  test('Tag 29 credit transfer sub-tags', async () => {
    const parsed = parseThaiQR(await creditTransferQR());
    const tag29 = parsed.parsedFields.find(f => f.tag === '29');
    const labels = Object.fromEntries(tag29!.subTags!.map(st => [st.tag, st.description]));

    expect(labels['00']).toBe('Application ID (AID)');
    expect(labels['01']).toBe('Mobile Number');
    expect(parsed.merchantId).toBe('0066812345678');
  });

  test('Tag 29 recipient type labels', () => {
    const value = (sub: string, id: string) =>
      `0016A000000677010111${sub}${String(id.length).padStart(2, '0')}${id}`;
    const labelFor = (sub: string, id: string) => {
      const v = value(sub, id);
      const parsed = parseThaiQR(withCRC(`00020101021129${v.length}${v}`));
      return parsed.parsedFields.find(f => f.tag === '29')!.subTags!.find(st => st.tag === sub)!.description;
    };

    expect(labelFor('02', '1234567890123')).toBe('National ID / Tax ID');
    expect(labelFor('03', '123456789012345')).toBe('E-Wallet ID');
    expect(labelFor('04', '0141234567')).toBe('Bank Account');
  });

  test('Tag 30 bill payment sub-tags', async () => {
    const parsed = parseThaiQR(await billPaymentQR());
    const tag30 = parsed.parsedFields.find(f => f.tag === '30');
    const labels = Object.fromEntries(tag30!.subTags!.map(st => [st.tag, st.description]));

    expect(labels).toEqual({
      '00': 'Application ID (AID)',
      '01': 'Biller ID',
      '02': 'Reference 1'
    });
    expect(parsed.merchantId).toBe('010566300012345');
    expect(parsed.reference).toBe('INV2024001');
  });
});
