import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string, successMessage?: string) => Promise<void>;
}

export const useClipboard = (): UseClipboardReturn => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string, successMessage = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage, { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, []);

  return { copied, copy };
};

export default useClipboard;
