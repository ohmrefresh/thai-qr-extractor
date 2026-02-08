/**
 * CRC16-CCITT calculation for QR code checksum.
 * Polynomial: 0x1021, Initial: 0xFFFF
 * Used by both standard Thai QR and Mini QR generators.
 */
export const calculateCRC16 = (data: string): string => {
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Format TLV (Tag-Length-Value) structure.
 * Tag: 2-char string, Length: 2-char zero-padded, Value: string.
 */
export const formatTLV = (tag: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
};
