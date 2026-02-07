import { useState, useEffect, useCallback } from 'react';
import { ThaiQRData } from '../utils/thaiQRParser';
import { HistoryItem } from '../components/History';
import {
  loadHistoryFromStorage,
  addToHistory as addToHistoryStorage,
  removeFromHistory as removeFromHistoryStorage,
  updateHistoryItemName as updateHistoryItemNameStorage,
  clearHistory as clearHistoryStorage
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
    toggleHistory,
    closeHistory
  };
};
