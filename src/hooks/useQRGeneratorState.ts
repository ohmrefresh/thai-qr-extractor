import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseQRGeneratorStateReturn<T> {
  result: T | null;
  errors: string[];
  isGenerating: boolean;
  qrResult: T | null;
  isPreview: boolean;
  setErrors: (errors: string[]) => void;
  clearErrors: () => void;
  clearResult: () => void;
  setPreviewResult: (result: T | null) => void;
  handleGenerate: (
    validateFn: () => string[],
    generateFn: () => Promise<T>,
    onSuccess?: (result: T) => void
  ) => Promise<void>;
}

export const useQRGeneratorState = <T>(): UseQRGeneratorStateReturn<T> => {
  const [result, setResult] = useState<T | null>(null);
  const [previewResult, setPreviewResult] = useState<T | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const clearErrors = useCallback(() => setErrors([]), []);

  const clearResult = useCallback(() => {
    setResult(null);
    setPreviewResult(null);
    setErrors([]);
  }, []);

  const handleGenerate = useCallback(async (
    validateFn: () => string[],
    generateFn: () => Promise<T>,
    onSuccess?: (result: T) => void
  ) => {
    const validationErrors = validateFn();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsGenerating(true);
      setErrors([]);
      const qrResult = await generateFn();
      setResult(qrResult);
      toast.success('QR code generated successfully');
      onSuccess?.(qrResult);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to generate QR code']);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const qrResult = result || previewResult;
  const isPreview = !result && !!previewResult;

  return {
    result,
    errors,
    isGenerating,
    qrResult,
    isPreview,
    setErrors,
    clearErrors,
    clearResult,
    setPreviewResult,
    handleGenerate,
  };
};
