import { describe, test, expect } from 'vitest';
import {
  CURRENCY_MAP,
  getCurrencyInfo,
  formatCurrencyDisplay,
  getCurrencyFlag,
  getCurrencyCountry,
  CurrencyInfo
} from '../currencyMapping';

describe('Currency Mapping Utility', () => {
  describe('CURRENCY_MAP', () => {
    test('contains Thai Baht (764)', () => {
      expect(CURRENCY_MAP['764']).toEqual({
        code: 'THB',
        flag: '🇹🇭',
        country: 'Thailand',
        name: 'Thai Baht'
      });
    });

    test('contains US Dollar (840)', () => {
      expect(CURRENCY_MAP['840']).toEqual({
        code: 'USD',
        flag: '🇺🇸',
        country: 'United States',
        name: 'US Dollar'
      });
    });

    test('contains Euro (978)', () => {
      expect(CURRENCY_MAP['978']).toEqual({
        code: 'EUR',
        flag: '🇪🇺',
        country: 'European Union',
        name: 'Euro'
      });
    });

    test('all entries have required properties', () => {
      Object.values(CURRENCY_MAP).forEach((currency: CurrencyInfo) => {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('flag');
        expect(currency).toHaveProperty('country');
        expect(currency).toHaveProperty('name');
        expect(typeof currency.code).toBe('string');
        expect(typeof currency.flag).toBe('string');
        expect(typeof currency.country).toBe('string');
        expect(typeof currency.name).toBe('string');
      });
    });

    test('contains expected number of currencies', () => {
      const currencyCount = Object.keys(CURRENCY_MAP).length;
      expect(currencyCount).toBeGreaterThan(0);
      // As of the current implementation, there are 30 currencies
      expect(currencyCount).toBe(30);
    });
  });

  describe('getCurrencyInfo', () => {
    test('returns correct info for Thai Baht', () => {
      const info = getCurrencyInfo('764');
      expect(info).not.toBeNull();
      expect(info?.code).toBe('THB');
      expect(info?.flag).toBe('🇹🇭');
      expect(info?.country).toBe('Thailand');
      expect(info?.name).toBe('Thai Baht');
    });

    test('returns correct info for Australian Dollar with leading zero', () => {
      const info = getCurrencyInfo('036');
      expect(info).not.toBeNull();
      expect(info?.code).toBe('AUD');
      expect(info?.flag).toBe('🇦🇺');
      expect(info?.country).toBe('Australia');
      expect(info?.name).toBe('Australian Dollar');
    });

    test('handles Australian Dollar without leading zeros', () => {
      const info = getCurrencyInfo('36');
      expect(info).not.toBeNull();
      expect(info?.code).toBe('AUD');
    });

    test('handles Canadian Dollar without leading zeros', () => {
      const info = getCurrencyInfo('124');
      expect(info).not.toBeNull();
      expect(info?.code).toBe('CAD');
    });

    test('returns null for unknown currency code', () => {
      const info = getCurrencyInfo('999');
      expect(info).toBeNull();
    });

    test('returns null for empty string', () => {
      const info = getCurrencyInfo('');
      expect(info).toBeNull();
    });

    test('returns null for invalid code', () => {
      const info = getCurrencyInfo('INVALID');
      expect(info).toBeNull();
    });

    test('handles all mapped currencies', () => {
      const codes = ['764', '840', '978', '826', '392', '156', '702', '458', '360', '608'];
      codes.forEach(code => {
        const info = getCurrencyInfo(code);
        expect(info).not.toBeNull();
        expect(info?.code).toBeDefined();
      });
    });
  });

  describe('formatCurrencyDisplay', () => {
    test('formats Thai Baht correctly', () => {
      const display = formatCurrencyDisplay('764');
      expect(display).toBe('THB (🇹🇭 Thailand)');
    });

    test('formats US Dollar correctly', () => {
      const display = formatCurrencyDisplay('840');
      expect(display).toBe('USD (🇺🇸 United States)');
    });

    test('formats Euro correctly', () => {
      const display = formatCurrencyDisplay('978');
      expect(display).toBe('EUR (🇪🇺 European Union)');
    });

    test('formats Japanese Yen correctly', () => {
      const display = formatCurrencyDisplay('392');
      expect(display).toBe('JPY (🇯🇵 Japan)');
    });

    test('formats Australian Dollar with leading zero correctly', () => {
      const display = formatCurrencyDisplay('036');
      expect(display).toBe('AUD (🇦🇺 Australia)');
    });

    test('returns original code for unknown currency', () => {
      const display = formatCurrencyDisplay('999');
      expect(display).toBe('999');
    });

    test('returns original code for empty string', () => {
      const display = formatCurrencyDisplay('');
      expect(display).toBe('');
    });

    test('returns original code for invalid input', () => {
      const display = formatCurrencyDisplay('INVALID');
      expect(display).toBe('INVALID');
    });
  });

  describe('getCurrencyFlag', () => {
    test('returns Thai flag for THB', () => {
      const flag = getCurrencyFlag('764');
      expect(flag).toBe('🇹🇭');
    });

    test('returns US flag for USD', () => {
      const flag = getCurrencyFlag('840');
      expect(flag).toBe('🇺🇸');
    });

    test('returns EU flag for EUR', () => {
      const flag = getCurrencyFlag('978');
      expect(flag).toBe('🇪🇺');
    });

    test('returns Japanese flag for JPY', () => {
      const flag = getCurrencyFlag('392');
      expect(flag).toBe('🇯🇵');
    });

    test('returns Australian flag with leading zero code', () => {
      const flag = getCurrencyFlag('036');
      expect(flag).toBe('🇦🇺');
    });

    test('returns empty string for unknown currency', () => {
      const flag = getCurrencyFlag('999');
      expect(flag).toBe('');
    });

    test('returns empty string for empty input', () => {
      const flag = getCurrencyFlag('');
      expect(flag).toBe('');
    });

    test('returns empty string for invalid input', () => {
      const flag = getCurrencyFlag('INVALID');
      expect(flag).toBe('');
    });

    test('returns flags for all Asian currencies', () => {
      const asianCurrencies = ['764', '392', '156', '702', '458', '360', '608', '704', '344', '410', '356'];
      asianCurrencies.forEach(code => {
        const flag = getCurrencyFlag(code);
        expect(flag).toBeTruthy();
        expect(flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCurrencyCountry', () => {
    test('returns Thailand for THB', () => {
      const country = getCurrencyCountry('764');
      expect(country).toBe('Thailand');
    });

    test('returns United States for USD', () => {
      const country = getCurrencyCountry('840');
      expect(country).toBe('United States');
    });

    test('returns European Union for EUR', () => {
      const country = getCurrencyCountry('978');
      expect(country).toBe('European Union');
    });

    test('returns Japan for JPY', () => {
      const country = getCurrencyCountry('392');
      expect(country).toBe('Japan');
    });

    test('returns Australia with leading zero code', () => {
      const country = getCurrencyCountry('036');
      expect(country).toBe('Australia');
    });

    test('returns empty string for unknown currency', () => {
      const country = getCurrencyCountry('999');
      expect(country).toBe('');
    });

    test('returns empty string for empty input', () => {
      const country = getCurrencyCountry('');
      expect(country).toBe('');
    });

    test('returns empty string for invalid input', () => {
      const country = getCurrencyCountry('INVALID');
      expect(country).toBe('');
    });

    test('returns countries for all mapped currencies', () => {
      Object.keys(CURRENCY_MAP).forEach(code => {
        const country = getCurrencyCountry(code);
        expect(country).toBeTruthy();
        expect(country.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge cases and integration', () => {
    test('handles padding normalization correctly', () => {
      // Test that codes with and without leading zeros work
      const withPadding = getCurrencyInfo('036');
      const withoutPadding = getCurrencyInfo('36');

      expect(withPadding).not.toBeNull();
      expect(withoutPadding).not.toBeNull();
      expect(withPadding?.code).toBe('AUD');
      expect(withoutPadding?.code).toBe('AUD');
    });

    test('all helper functions work consistently', () => {
      const code = '764';
      const info = getCurrencyInfo(code);
      const display = formatCurrencyDisplay(code);
      const flag = getCurrencyFlag(code);
      const country = getCurrencyCountry(code);

      expect(info).not.toBeNull();
      expect(display).toContain(info!.code);
      expect(display).toContain(info!.flag);
      expect(display).toContain(info!.country);
      expect(flag).toBe(info!.flag);
      expect(country).toBe(info!.country);
    });

    test('handles ASEAN currencies', () => {
      const aseanCurrencies = {
        '764': 'THB', // Thailand
        '702': 'SGD', // Singapore
        '458': 'MYR', // Malaysia
        '360': 'IDR', // Indonesia
        '608': 'PHP', // Philippines
        '704': 'VND'  // Vietnam
      };

      Object.entries(aseanCurrencies).forEach(([code, expectedCode]) => {
        const info = getCurrencyInfo(code);
        expect(info).not.toBeNull();
        expect(info?.code).toBe(expectedCode);
      });
    });

    test('handles major global currencies', () => {
      const majorCurrencies = {
        '840': 'USD',
        '978': 'EUR',
        '392': 'JPY',
        '826': 'GBP',
        '156': 'CNY'
      };

      Object.entries(majorCurrencies).forEach(([code, expectedCode]) => {
        const info = getCurrencyInfo(code);
        expect(info).not.toBeNull();
        expect(info?.code).toBe(expectedCode);
      });
    });
  });
});
