import {
  saveHistoryToStorage,
  loadHistoryFromStorage,
  addToHistory,
  removeFromHistory,
  updateHistoryItemName,
  clearHistory,
} from '../historyStorage';
import { HistoryItem } from '../../components/History';

const HISTORY_STORAGE_KEY = 'thai-qr-history';

describe('historyStorage', () => {
  const originalCrypto = global.crypto;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();

    // Mock crypto.randomUUID for tests
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: () => 'test-uuid-' + Math.random(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original crypto
    global.crypto = originalCrypto;
  });

  describe('saveHistoryToStorage', () => {
    test('saves history to localStorage', () => {
      const history: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: '00020101',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date('2024-01-01T00:00:00Z'),
          source: 'text',
        },
      ];

      saveHistoryToStorage(history);

      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('1');
      expect(parsed[0].timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    test('serializes timestamps correctly', () => {
      const timestamp = new Date('2024-06-15T12:30:00Z');
      const history: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: '00020101',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp,
          source: 'text',
        },
      ];

      saveHistoryToStorage(history);

      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed[0].timestamp).toBe('2024-06-15T12:30:00.000Z');
    });

    test('handles save errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock localStorage.setItem to throw error
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      const history: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: '00020101',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
      ];

      saveHistoryToStorage(history);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save history to localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('loadHistoryFromStorage', () => {
    test('loads history from localStorage', () => {
      const serialized = JSON.stringify([
        {
          id: '1',
          data: {
            rawData: '00020101',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: '2024-01-01T00:00:00.000Z',
          source: 'text',
        },
      ]);

      localStorage.setItem(HISTORY_STORAGE_KEY, serialized);

      const history = loadHistoryFromStorage();

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('1');
      expect(history[0].timestamp).toBeInstanceOf(Date);
      expect(history[0].timestamp.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    test('returns empty array when no history exists', () => {
      const history = loadHistoryFromStorage();
      expect(history).toEqual([]);
    });

    test('handles invalid JSON gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      localStorage.setItem(HISTORY_STORAGE_KEY, 'invalid json{');

      const history = loadHistoryFromStorage();

      expect(history).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load history from localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    test('handles storage errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const history = loadHistoryFromStorage();

      expect(history).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load history from localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
      getItemSpy.mockRestore();
    });

    test('deserializes timestamps correctly', () => {
      const serialized = JSON.stringify([
        {
          id: '1',
          data: {
            rawData: '00020101',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: '2024-06-15T12:30:00.000Z',
          source: 'text',
        },
      ]);

      localStorage.setItem(HISTORY_STORAGE_KEY, serialized);

      const history = loadHistoryFromStorage();

      expect(history[0].timestamp).toBeInstanceOf(Date);
      expect(history[0].timestamp.getTime()).toBe(new Date('2024-06-15T12:30:00.000Z').getTime());
    });
  });

  describe('addToHistory', () => {
    test('adds new item to history', () => {
      const currentHistory: HistoryItem[] = [];
      const newItem = {
        data: {
          rawData: '00020101',
          version: '01',
          type: '12',
          parsedFields: [],
        },
        source: 'text' as const,
      };

      const updatedHistory = addToHistory(currentHistory, newItem);

      expect(updatedHistory).toHaveLength(1);
      expect(updatedHistory[0].data.rawData).toBe('00020101');
      expect(updatedHistory[0].id).toBeTruthy();
      expect(updatedHistory[0].timestamp).toBeInstanceOf(Date);
    });

    test('adds new item to beginning of history', () => {
      const currentHistory: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: 'old-data',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date('2024-01-01'),
          source: 'text',
        },
      ];
      const newItem = {
        data: {
          rawData: 'new-data',
          version: '01',
          type: '12',
          parsedFields: [],
        },
        source: 'text' as const,
      };

      const updatedHistory = addToHistory(currentHistory, newItem);

      expect(updatedHistory).toHaveLength(2);
      expect(updatedHistory[0].data.rawData).toBe('new-data');
      expect(updatedHistory[1].data.rawData).toBe('old-data');
    });

    test('limits history to MAX_HISTORY_ITEMS (50)', () => {
      // Create 50 existing items
      const currentHistory: HistoryItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        data: {
          rawData: `data-${i}`,
          version: '01',
          type: '12',
          parsedFields: [],
        },
        timestamp: new Date(),
        source: 'text' as const,
      }));

      const newItem = {
        data: {
          rawData: 'new-data',
          version: '01',
          type: '12',
          parsedFields: [],
        },
        source: 'text' as const,
      };

      const updatedHistory = addToHistory(currentHistory, newItem);

      expect(updatedHistory).toHaveLength(50);
      expect(updatedHistory[0].data.rawData).toBe('new-data');
      expect(updatedHistory[49].data.rawData).toBe('data-48'); // Last old item should be data-48
    });

    test('generates unique ID for new item', () => {
      const currentHistory: HistoryItem[] = [];
      const newItem = {
        data: {
          rawData: '00020101',
          version: '01',
          type: '12',
          parsedFields: [],
        },
        source: 'text' as const,
      };

      const updatedHistory = addToHistory(currentHistory, newItem);

      expect(updatedHistory[0].id).toBeTruthy();
      expect(typeof updatedHistory[0].id).toBe('string');
    });

    test('saves updated history to localStorage', () => {
      const currentHistory: HistoryItem[] = [];
      const newItem = {
        data: {
          rawData: '00020101',
          version: '01',
          type: '12',
          parsedFields: [],
        },
        source: 'text' as const,
      };

      addToHistory(currentHistory, newItem);

      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
    });

    test('generates fallback ID when crypto.randomUUID is not available', () => {
      // Mock crypto.randomUUID to be undefined
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
      });

      const currentHistory: HistoryItem[] = [];
      const newItem = {
        data: {
          rawData: '00020101',
          version: '01',
          type: '12',
          parsedFields: [],
        },
        source: 'text' as const,
      };

      const updatedHistory = addToHistory(currentHistory, newItem);

      expect(updatedHistory[0].id).toBeTruthy();
      expect(typeof updatedHistory[0].id).toBe('string');
    });
  });

  describe('removeFromHistory', () => {
    test('removes item from history by id', () => {
      const currentHistory: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: 'data-1',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
        {
          id: '2',
          data: {
            rawData: 'data-2',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
        {
          id: '3',
          data: {
            rawData: 'data-3',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
      ];

      const updatedHistory = removeFromHistory(currentHistory, '2');

      expect(updatedHistory).toHaveLength(2);
      expect(updatedHistory.find(item => item.id === '2')).toBeUndefined();
      expect(updatedHistory.find(item => item.id === '1')).toBeTruthy();
      expect(updatedHistory.find(item => item.id === '3')).toBeTruthy();
    });

    test('returns unchanged history if id not found', () => {
      const currentHistory: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: 'data-1',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
      ];

      const updatedHistory = removeFromHistory(currentHistory, 'nonexistent');

      expect(updatedHistory).toHaveLength(1);
      expect(updatedHistory[0].id).toBe('1');
    });

    test('saves updated history to localStorage', () => {
      const currentHistory: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: 'data-1',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
        {
          id: '2',
          data: {
            rawData: 'data-2',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
      ];

      removeFromHistory(currentHistory, '1');

      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('2');
    });
  });

  describe('clearHistory', () => {
    test('removes history from localStorage', () => {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([{
        id: '1',
        data: { rawData: 'data', version: '01', type: '12', parsedFields: [] },
        timestamp: new Date().toISOString(),
        source: 'text'
      }]));

      expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeTruthy();

      clearHistory();

      expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
    });

    test('returns empty array', () => {
      const result = clearHistory();
      expect(result).toEqual([]);
    });

    test('handles clear errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = clearHistory();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to clear history from localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
      removeItemSpy.mockRestore();
    });
  });

  describe('updateHistoryItemName', () => {
    test('updates custom name for matching history item', () => {
      const currentHistory: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: 'data-1',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
      ];

      const updatedHistory = updateHistoryItemName(currentHistory, '1', 'My Favorite QR');

      expect(updatedHistory[0].customName).toBe('My Favorite QR');
    });

    test('saves updated name to localStorage', () => {
      const currentHistory: HistoryItem[] = [
        {
          id: '1',
          data: {
            rawData: 'data-1',
            version: '01',
            type: '12',
            parsedFields: [],
          },
          timestamp: new Date(),
          source: 'text',
        },
      ];

      updateHistoryItemName(currentHistory, '1', 'Renamed QR');

      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed[0].customName).toBe('Renamed QR');
    });
  });
});
