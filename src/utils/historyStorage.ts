import { HistoryItem } from '../components/History';

const HISTORY_STORAGE_KEY = 'thai-qr-history';
const MAX_HISTORY_ITEMS = 50;

export const saveHistoryToStorage = (history: HistoryItem[]): void => {
  try {
    const serializedHistory = history.map(item => ({
      ...item,
      timestamp: item.timestamp.toISOString()
    }));
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(serializedHistory));
  } catch (error) {
    console.warn('Failed to save history to localStorage:', error);
  }
};

export const loadHistoryFromStorage = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch (error) {
    console.warn('Failed to load history from localStorage:', error);
    return [];
  }
};

export const addToHistory = (
  currentHistory: HistoryItem[], 
  newItem: Omit<HistoryItem, 'id' | 'timestamp'>
): HistoryItem[] => {
  const historyItem: HistoryItem = {
    ...newItem,
    id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date()
  };
  
  // Add to beginning and limit to MAX_HISTORY_ITEMS
  const updatedHistory = [historyItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
  
  saveHistoryToStorage(updatedHistory);
  return updatedHistory;
};

export const removeFromHistory = (
  currentHistory: HistoryItem[], 
  itemId: string
): HistoryItem[] => {
  const updatedHistory = currentHistory.filter(item => item.id !== itemId);
  saveHistoryToStorage(updatedHistory);
  return updatedHistory;
};

export const clearHistory = (): HistoryItem[] => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear history from localStorage:', error);
  }
  return [];
};