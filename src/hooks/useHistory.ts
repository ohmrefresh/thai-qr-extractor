import { useState, useEffect, useCallback } from 'react';
import { ThaiQRData } from '../utils/thaiQRParser';
import { HistoryItem } from '../components/History';
import {
  loadHistoryFromStorage,
  addToHistory as addToHistoryStorage,
  removeFromHistory as removeFromHistoryStorage,
  updateHistoryItemName as updateHistoryItemNameStorage,
  clearHistory as clearHistoryStorage,
  saveHistoryToStorage
} from '../utils/historyStorage';

export type ScanSource = 'camera' | 'file' | 'text';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const savedHistory = loadHistoryFromStorage();
    setHistory(savedHistory);
  }, []);

  const addToHistory = useCallback((data: ThaiQRData, source: ScanSource) => {
    const updatedHistory = addToHistoryStorage(history, { data, source });
    setHistory(updatedHistory);
  }, [history]);

  const removeFromHistory = useCallback((id: string) => {
    const updatedHistory = removeFromHistoryStorage(history, id);
    setHistory(updatedHistory);
  }, [history]);

  const renameHistoryItem = useCallback((id: string, customName: string) => {
    const updatedHistory = updateHistoryItemNameStorage(history, id, customName);
    setHistory(updatedHistory);
  }, [history]);

  const clearHistory = useCallback(() => {
    const emptyHistory = clearHistoryStorage();
    setHistory(emptyHistory);
  }, []);

  // Puts back a snapshot, e.g. to undo Clear all
  const restoreHistory = useCallback((items: HistoryItem[]) => {
    saveHistoryToStorage(items);
    setHistory(items);
  }, []);

  const toggleHistory = useCallback(() => {
    setIsHistoryOpen(prev => !prev);
  }, []);

  const closeHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  return {
    history,
    isHistoryOpen,
    addToHistory,
    removeFromHistory,
    renameHistoryItem,
    clearHistory,
    restoreHistory,
    toggleHistory,
    closeHistory
  };
};
