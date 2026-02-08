import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDebouncedPreviewOptions<T> {
  hasRequiredFields: boolean;
  generateFn: () => Promise<T>;
  delay?: number;
}

interface UseDebouncedPreviewReturn<T> {
  previewResult: T | null;
  isGeneratingPreview: boolean;
  clearPreview: () => void;
}

export const useDebouncedPreview = <T>({
  hasRequiredFields,
  generateFn,
  delay = 500,
}: UseDebouncedPreviewOptions<T>): UseDebouncedPreviewReturn<T> => {
  const [previewResult, setPreviewResult] = useState<T | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!hasRequiredFields) {
      setPreviewResult(null);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        const result = await generateFn();
        setPreviewResult(result);
      } catch {
        setPreviewResult(null);
      } finally {
        setIsGeneratingPreview(false);
      }
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [hasRequiredFields, generateFn, delay]);

  const clearPreview = useCallback(() => {
    setPreviewResult(null);
  }, []);

  return { previewResult, isGeneratingPreview, clearPreview };
};
