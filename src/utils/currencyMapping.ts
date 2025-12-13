/**
 * Currency Mapping Utility
 * Maps ISO 4217 currency codes to flag emojis and country information
 */

export interface CurrencyInfo {
  code: string;
  flag: string;
  country: string;
  name: string;
}

/**
 * ISO 4217 currency code to country and flag mapping
 * Common currencies used in QR payments
 */
export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // Thai Baht
  '764': {
    code: 'THB',
    flag: '🇹🇭',
    country: 'Thailand',
    name: 'Thai Baht'
  },
  // US Dollar
  '840': {
    code: 'USD',
    flag: '🇺🇸',
    country: 'United States',
    name: 'US Dollar'
  },
  // Euro
  '978': {
    code: 'EUR',
    flag: '🇪🇺',
    country: 'European Union',
    name: 'Euro'
  },
  // British Pound
  '826': {
    code: 'GBP',
    flag: '🇬🇧',
    country: 'United Kingdom',
    name: 'British Pound'
  },
  // Japanese Yen
  '392': {
    code: 'JPY',
    flag: '🇯🇵',
    country: 'Japan',
    name: 'Japanese Yen'
  },
  // Chinese Yuan
  '156': {
    code: 'CNY',
    flag: '🇨🇳',
    country: 'China',
    name: 'Chinese Yuan'
  },
  // Singapore Dollar
  '702': {
    code: 'SGD',
    flag: '🇸🇬',
    country: 'Singapore',
    name: 'Singapore Dollar'
  },
  // Malaysian Ringgit
  '458': {
    code: 'MYR',
    flag: '🇲🇾',
    country: 'Malaysia',
    name: 'Malaysian Ringgit'
  },
  // Indonesian Rupiah
  '360': {
    code: 'IDR',
    flag: '🇮🇩',
    country: 'Indonesia',
    name: 'Indonesian Rupiah'
  },
  // Philippine Peso
  '608': {
    code: 'PHP',
    flag: '🇵🇭',
    country: 'Philippines',
    name: 'Philippine Peso'
  },
  // Vietnamese Dong
  '704': {
    code: 'VND',
    flag: '🇻🇳',
    country: 'Vietnam',
    name: 'Vietnamese Dong'
  },
  // Hong Kong Dollar
  '344': {
    code: 'HKD',
    flag: '🇭🇰',
    country: 'Hong Kong',
    name: 'Hong Kong Dollar'
  },
  // Australian Dollar
  '036': {
    code: 'AUD',
    flag: '🇦🇺',
    country: 'Australia',
    name: 'Australian Dollar'
  },
  // Canadian Dollar
  '124': {
    code: 'CAD',
    flag: '🇨🇦',
    country: 'Canada',
    name: 'Canadian Dollar'
  },
  // Swiss Franc
  '756': {
    code: 'CHF',
    flag: '🇨🇭',
    country: 'Switzerland',
    name: 'Swiss Franc'
  },
  // South Korean Won
  '410': {
    code: 'KRW',
    flag: '🇰🇷',
    country: 'South Korea',
    name: 'South Korean Won'
  },
  // Indian Rupee
  '356': {
    code: 'INR',
    flag: '🇮🇳',
    country: 'India',
    name: 'Indian Rupee'
  },
  // New Zealand Dollar
  '554': {
    code: 'NZD',
    flag: '🇳🇿',
    country: 'New Zealand',
    name: 'New Zealand Dollar'
  },
  // Swedish Krona
  '752': {
    code: 'SEK',
    flag: '🇸🇪',
    country: 'Sweden',
    name: 'Swedish Krona'
  },
  // Norwegian Krone
  '578': {
    code: 'NOK',
    flag: '🇳🇴',
    country: 'Norway',
    name: 'Norwegian Krone'
  },
  // Danish Krone
  '208': {
    code: 'DKK',
    flag: '🇩🇰',
    country: 'Denmark',
    name: 'Danish Krone'
  },
  // Polish Zloty
  '985': {
    code: 'PLN',
    flag: '🇵🇱',
    country: 'Poland',
    name: 'Polish Zloty'
  },
  // Russian Ruble
  '643': {
    code: 'RUB',
    flag: '🇷🇺',
    country: 'Russia',
    name: 'Russian Ruble'
  },
  // Turkish Lira
  '949': {
    code: 'TRY',
    flag: '🇹🇷',
    country: 'Turkey',
    name: 'Turkish Lira'
  },
  // Brazilian Real
  '986': {
    code: 'BRL',
    flag: '🇧🇷',
    country: 'Brazil',
    name: 'Brazilian Real'
  },
  // Mexican Peso
  '484': {
    code: 'MXN',
    flag: '🇲🇽',
    country: 'Mexico',
    name: 'Mexican Peso'
  },
  // South African Rand
  '710': {
    code: 'ZAR',
    flag: '🇿🇦',
    country: 'South Africa',
    name: 'South African Rand'
  },
  // Saudi Riyal
  '682': {
    code: 'SAR',
    flag: '🇸🇦',
    country: 'Saudi Arabia',
    name: 'Saudi Riyal'
  },
  // UAE Dirham
  '784': {
    code: 'AED',
    flag: '🇦🇪',
    country: 'United Arab Emirates',
    name: 'UAE Dirham'
  },
  // Kuwaiti Dinar
  '414': {
    code: 'KWD',
    flag: '🇰🇼',
    country: 'Kuwait',
    name: 'Kuwaiti Dinar'
  }
};

/**
 * Get currency information by ISO 4217 numeric code
 * @param currencyCode - ISO 4217 numeric currency code (e.g., "764" for THB)
 * @returns Currency information including flag and country, or null if not found
 */
export const getCurrencyInfo = (currencyCode: string): CurrencyInfo | null => {
  // Remove leading zeros for lookup (e.g., "036" -> "036" but also check without padding)
  const normalizedCode = currencyCode.padStart(3, '0');

  return CURRENCY_MAP[normalizedCode] || CURRENCY_MAP[currencyCode] || null;
};

/**
 * Format currency display with flag and country
 * @param currencyCode - ISO 4217 numeric currency code
 * @returns Formatted string with flag, code, and country (e.g., "🇹🇭 THB (Thailand)")
 */
export const formatCurrencyDisplay = (currencyCode: string): string => {
  const info = getCurrencyInfo(currencyCode);

  if (info) {
    return `${info.code} (${info.flag} ${info.country})`;
  }

  return currencyCode;
};

/**
 * Get just the flag emoji for a currency code
 * @param currencyCode - ISO 4217 numeric currency code
 * @returns Flag emoji or empty string if not found
 */
export const getCurrencyFlag = (currencyCode: string): string => {
  const info = getCurrencyInfo(currencyCode);
  return info?.flag || '';
};

/**
 * Get country name for a currency code
 * @param currencyCode - ISO 4217 numeric currency code
 * @returns Country name or empty string if not found
 */
export const getCurrencyCountry = (currencyCode: string): string => {
  const info = getCurrencyInfo(currencyCode);
  return info?.country || '';
};
