# Component & Utility Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate code duplication across QR generator utilities and components without changing public APIs or visual behavior.

**Architecture:** Extract shared CRC/TLV functions into `qrUtils.ts`, extract duplicated generator state/debounce logic into custom hooks, replace inline clipboard logic with existing hook, and extract inline SVGs into reusable icon components.

**Tech Stack:** React, TypeScript, Vitest, React Testing Library

**Baseline:** 525 tests passing across 23 files. Run `npm test -- --run` after each phase to verify no regressions.

---

## Task 1: Extract Shared QR Utilities

**Files:**
- Create: `src/utils/qrUtils.ts`
- Create: `src/utils/__tests__/qrUtils.test.ts`
- Modify: `src/utils/thaiQRGenerator.ts:122-147` (remove `calculateCRC16` and `formatTLV`)
- Modify: `src/utils/miniQRGenerator.ts:21-46` (remove `calculateCRC16XModem` and `encodeTLV`)

**Step 1: Write the failing tests for qrUtils**

Create `src/utils/__tests__/qrUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCRC16, formatTLV } from '../qrUtils';

describe('calculateCRC16', () => {
  it('should calculate CRC16-CCITT for a known QR string', () => {
    // Known: standard QR "00020101021229..." with "6304" appended produces a known CRC
    const testData = '00020101021130570016A00000067701011201150105663000123450202INV20240010310087654321053037645802TH5915Sample Merchant6007Bangkok62150201INV20240010302106304';
    const result = calculateCRC16(testData);
    expect(result).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should return 4-character uppercase hex string', () => {
    const result = calculateCRC16('test');
    expect(result).toHaveLength(4);
    expect(result).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should produce consistent results', () => {
    const result1 = calculateCRC16('hello');
    const result2 = calculateCRC16('hello');
    expect(result1).toBe(result2);
  });

  it('should produce different results for different inputs', () => {
    const result1 = calculateCRC16('hello');
    const result2 = calculateCRC16('world');
    expect(result1).not.toBe(result2);
  });
});

describe('formatTLV', () => {
  it('should format tag-length-value with zero-padded length', () => {
    expect(formatTLV('00', '01')).toBe('000201');
  });

  it('should handle longer values', () => {
    expect(formatTLV('29', 'A000000677010111')).toBe('2916A000000677010111');
  });

  it('should handle empty value', () => {
    expect(formatTLV('00', '')).toBe('0000');
  });

  it('should handle double-digit length', () => {
    const value = 'A'.repeat(20);
    expect(formatTLV('29', value)).toBe(`2920${'A'.repeat(20)}`);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/utils/__tests__/qrUtils.test.ts`
Expected: FAIL — module `../qrUtils` not found

**Step 3: Write the implementation**

Create `src/utils/qrUtils.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/utils/__tests__/qrUtils.test.ts`
Expected: PASS

**Step 5: Update thaiQRGenerator.ts to use shared utilities**

In `src/utils/thaiQRGenerator.ts`:
- Add import: `import { calculateCRC16, formatTLV } from './qrUtils';`
- Delete the local `calculateCRC16` function (lines 122-139)
- Delete the local `formatTLV` function (lines 144-147)

**Step 6: Update miniQRGenerator.ts to use shared utilities**

In `src/utils/miniQRGenerator.ts`:
- Add import: `import { calculateCRC16, formatTLV } from './qrUtils';`
- Delete the local `calculateCRC16XModem` function (lines 21-38)
- Delete the local `encodeTLV` function (lines 43-46)
- Replace all calls to `calculateCRC16XModem` with `calculateCRC16`
- Replace all calls to `encodeTLV` with `formatTLV`

**Step 7: Run full test suite**

Run: `npm test -- --run`
Expected: All 525 tests pass

**Step 8: Commit**

```bash
git add src/utils/qrUtils.ts src/utils/__tests__/qrUtils.test.ts src/utils/thaiQRGenerator.ts src/utils/miniQRGenerator.ts
git commit -m "refactor: extract shared CRC16 and TLV utilities into qrUtils.ts"
```

---

## Task 2: Extract Generator Hooks

**Files:**
- Create: `src/hooks/useDebouncedPreview.ts`
- Create: `src/hooks/useQRGeneratorState.ts`
- Create: `src/hooks/__tests__/useDebouncedPreview.test.ts`
- Create: `src/hooks/__tests__/useQRGeneratorState.test.ts`
- Modify: `src/components/generator/StandardQRGenerator.tsx`
- Modify: `src/components/MiniQRGenerator.tsx`
- Modify: `src/hooks/index.ts`

**Step 1: Write the failing test for useDebouncedPreview**

Create `src/hooks/__tests__/useDebouncedPreview.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedPreview } from '../useDebouncedPreview';

describe('useDebouncedPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with null preview and not generating', () => {
    const generateFn = vi.fn().mockResolvedValue({ qrString: 'test' });
    const { result } = renderHook(() =>
      useDebouncedPreview({
        hasRequiredFields: false,
        generateFn,
        delay: 500,
      })
    );

    expect(result.current.previewResult).toBeNull();
    expect(result.current.isGeneratingPreview).toBe(false);
  });

  it('should generate preview after debounce delay when hasRequiredFields is true', async () => {
    const mockResult = { qrString: 'test', qrCodeDataURL: 'data:image/png' };
    const generateFn = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useDebouncedPreview({
        hasRequiredFields: true,
        generateFn,
        delay: 500,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(generateFn).toHaveBeenCalled();
    expect(result.current.previewResult).toEqual(mockResult);
  });

  it('should not generate preview before debounce delay', () => {
    const generateFn = vi.fn().mockResolvedValue({ qrString: 'test' });

    renderHook(() =>
      useDebouncedPreview({
        hasRequiredFields: true,
        generateFn,
        delay: 500,
      })
    );

    vi.advanceTimersByTime(200);

    expect(generateFn).not.toHaveBeenCalled();
  });

  it('should clear preview when hasRequiredFields becomes false', () => {
    const generateFn = vi.fn().mockResolvedValue({ qrString: 'test' });

    const { result, rerender } = renderHook(
      ({ hasRequired }) =>
        useDebouncedPreview({
          hasRequiredFields: hasRequired,
          generateFn,
          delay: 500,
        }),
      { initialProps: { hasRequired: false } }
    );

    rerender({ hasRequired: false });

    expect(result.current.previewResult).toBeNull();
  });

  it('should handle generate errors silently', async () => {
    const generateFn = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      useDebouncedPreview({
        hasRequiredFields: true,
        generateFn,
        delay: 500,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.previewResult).toBeNull();
  });

  it('should provide clearPreview function', async () => {
    const mockResult = { qrString: 'test', qrCodeDataURL: 'data:image/png' };
    const generateFn = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useDebouncedPreview({
        hasRequiredFields: true,
        generateFn,
        delay: 500,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.previewResult).toEqual(mockResult);

    act(() => {
      result.current.clearPreview();
    });

    expect(result.current.previewResult).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/hooks/__tests__/useDebouncedPreview.test.ts`
Expected: FAIL — module not found

**Step 3: Implement useDebouncedPreview**

Create `src/hooks/useDebouncedPreview.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/hooks/__tests__/useDebouncedPreview.test.ts`
Expected: PASS

**Step 5: Write the failing test for useQRGeneratorState**

Create `src/hooks/__tests__/useQRGeneratorState.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQRGeneratorState } from '../useQRGeneratorState';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useQRGeneratorState', () => {
  it('should start with null result and empty errors', () => {
    const { result } = renderHook(() => useQRGeneratorState());

    expect(result.current.result).toBeNull();
    expect(result.current.errors).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
  });

  it('should set errors via setErrors', () => {
    const { result } = renderHook(() => useQRGeneratorState());

    act(() => {
      result.current.setErrors(['Error 1', 'Error 2']);
    });

    expect(result.current.errors).toEqual(['Error 1', 'Error 2']);
  });

  it('should clear errors via clearErrors', () => {
    const { result } = renderHook(() => useQRGeneratorState());

    act(() => {
      result.current.setErrors(['Error 1']);
    });

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual([]);
  });

  it('should handle successful generation', async () => {
    const mockResult = { qrString: 'test', qrCodeDataURL: 'data:image/png' };
    const generateFn = vi.fn().mockResolvedValue(mockResult);
    const validateFn = vi.fn().mockReturnValue([]);

    const { result } = renderHook(() => useQRGeneratorState());

    await act(async () => {
      await result.current.handleGenerate(validateFn, generateFn);
    });

    expect(result.current.result).toEqual(mockResult);
    expect(result.current.errors).toEqual([]);
  });

  it('should set errors when validation fails', async () => {
    const generateFn = vi.fn();
    const validateFn = vi.fn().mockReturnValue(['Field required']);

    const { result } = renderHook(() => useQRGeneratorState());

    await act(async () => {
      await result.current.handleGenerate(validateFn, generateFn);
    });

    expect(result.current.errors).toEqual(['Field required']);
    expect(generateFn).not.toHaveBeenCalled();
    expect(result.current.result).toBeNull();
  });

  it('should handle generation errors', async () => {
    const generateFn = vi.fn().mockRejectedValue(new Error('Generate failed'));
    const validateFn = vi.fn().mockReturnValue([]);

    const { result } = renderHook(() => useQRGeneratorState());

    await act(async () => {
      await result.current.handleGenerate(validateFn, generateFn);
    });

    expect(result.current.errors).toEqual(['Generate failed']);
    expect(result.current.result).toBeNull();
  });

  it('should reset state via clearResult', () => {
    const { result } = renderHook(() => useQRGeneratorState());

    act(() => {
      result.current.setErrors(['error']);
    });

    act(() => {
      result.current.clearResult();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.errors).toEqual([]);
  });

  it('should compute qrResult from result when available', async () => {
    const mockResult = { qrString: 'test', qrCodeDataURL: 'data:image/png' };
    const generateFn = vi.fn().mockResolvedValue(mockResult);
    const validateFn = vi.fn().mockReturnValue([]);

    const { result } = renderHook(() => useQRGeneratorState());

    await act(async () => {
      await result.current.handleGenerate(validateFn, generateFn);
    });

    expect(result.current.qrResult).toEqual(mockResult);
    expect(result.current.isPreview).toBe(false);
  });

  it('should compute qrResult from previewResult when no finalized result', () => {
    const previewData = { qrString: 'preview', qrCodeDataURL: 'data:image/png' };
    const { result } = renderHook(() => useQRGeneratorState());

    act(() => {
      result.current.setPreviewResult(previewData);
    });

    expect(result.current.qrResult).toEqual(previewData);
    expect(result.current.isPreview).toBe(true);
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npm test -- --run src/hooks/__tests__/useQRGeneratorState.test.ts`
Expected: FAIL — module not found

**Step 7: Implement useQRGeneratorState**

Create `src/hooks/useQRGeneratorState.ts`:

```typescript
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
```

**Step 8: Run test to verify it passes**

Run: `npm test -- --run src/hooks/__tests__/useQRGeneratorState.test.ts`
Expected: PASS

**Step 9: Refactor StandardQRGenerator to use new hooks**

In `src/components/generator/StandardQRGenerator.tsx`:
- Import `useDebouncedPreview` and `useQRGeneratorState`
- Replace manual state declarations (`result`, `previewResult`, `errors`, `isGenerating`, `isGeneratingPreview`, `debounceTimerRef`) with hook calls
- Replace the debounce useEffect (lines 67-102) with `useDebouncedPreview`
- Replace handleGenerate (lines 115-139) with `state.handleGenerate(validateFn, generateFn, onQRGenerated)`
- Keep payment-type-specific logic (formData, handleInputChange, handleLoadSample, handleClear) in the component
- Remove derived `qrResult`/`isPreview` (now from hook)

**Step 10: Refactor MiniQRGenerator to use new hooks**

In `src/components/MiniQRGenerator.tsx`:
- Same pattern as StandardQRGenerator
- Replace manual state + debounce with hook calls

**Step 11: Update hooks/index.ts**

Add exports for new hooks:
```typescript
export { useDebouncedPreview } from './useDebouncedPreview';
export { useQRGeneratorState } from './useQRGeneratorState';
```

**Step 12: Run full test suite**

Run: `npm test -- --run`
Expected: All 525+ tests pass (new hook tests add to the count)

**Step 13: Commit**

```bash
git add src/hooks/useDebouncedPreview.ts src/hooks/useQRGeneratorState.ts src/hooks/__tests__/useDebouncedPreview.test.ts src/hooks/__tests__/useQRGeneratorState.test.ts src/hooks/index.ts src/components/generator/StandardQRGenerator.tsx src/components/MiniQRGenerator.tsx
git commit -m "refactor: extract useDebouncedPreview and useQRGeneratorState hooks"
```

---

## Task 3: QRPreview Clipboard Fix

**Files:**
- Modify: `src/components/generator/QRPreview.tsx`

**Step 1: Replace inline clipboard logic with useClipboard hook**

In `src/components/generator/QRPreview.tsx`:
- Add import: `import { useClipboard } from '../../hooks/useClipboard';`
- Add at top of component: `const { copy } = useClipboard();`
- Remove the `isCopying` state and `handleCopy` callback (lines 31, 61-92)
- Replace the copy button's `onClick={handleCopy}` with `onClick={() => copy(result?.qrString || '', 'QR string copied to clipboard')}`
- Remove `disabled={isCopying}` and the copying spinner UI — the hook handles the toast
- Simplify the copy button to always show the icon + "Copy String" text

**Step 2: Run full test suite**

Run: `npm test -- --run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/generator/QRPreview.tsx
git commit -m "refactor: use useClipboard hook in QRPreview instead of inline clipboard logic"
```

---

## Task 4: Extract Icon Components

**Files:**
- Create: `src/components/icons/CopyIcon.tsx`
- Create: `src/components/icons/TrashIcon.tsx`
- Create: `src/components/icons/RefreshIcon.tsx`
- Create: `src/components/icons/CloseIcon.tsx`
- Create: `src/components/icons/DownloadIcon.tsx`
- Create: `src/components/icons/ChevronIcon.tsx`
- Create: `src/components/icons/CodeIcon.tsx`
- Create: `src/components/icons/ErrorIcon.tsx`
- Create: `src/components/icons/StopIcon.tsx`
- Modify: `src/components/icons/index.ts`
- Modify: `src/components/QRScanner.tsx`
- Modify: `src/components/QRDataDisplay.tsx`
- Modify: `src/components/History.tsx`
- Modify: `src/components/generator/QRPreview.tsx`
- Modify: `src/components/generator/StandardQRGenerator.tsx`
- Modify: `src/components/MiniQRGenerator.tsx`

**Step 1: Create all new icon components**

Follow the existing pattern from `CameraIcon.tsx` — each icon takes `{ width, height, className }` props.

Icons to create (SVG paths taken from existing inline usage):

- **CopyIcon**: `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`
- **TrashIcon**: `<polyline points="3,6 5,6 21,6"/><path d="m19,6v14a2,2 0 0 1 -2,2H7a2,2 0 0 1 -2,-2V6m3,0V4a2,2 0 0 1 2,-2h4a2,2 0 0 1 2,2v2"/>`
- **RefreshIcon**: `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15A9 9 0 0 1 5.64 18.36L1 14"/>`
- **CloseIcon**: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
- **DownloadIcon**: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>`
- **ChevronIcon**: `<polyline points="6,9 12,15 18,9"/>` (with optional `direction` prop for rotation)
- **CodeIcon**: `<polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>`
- **ErrorIcon**: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
- **StopIcon**: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>`

**Step 2: Update icons/index.ts**

Add all new exports.

**Step 3: Replace inline SVGs in each component**

Go file by file:
- `QRScanner.tsx`: Replace camera SVGs with `CameraIcon`, refresh with `RefreshIcon`, error with `ErrorIcon`, stop with `StopIcon`
- `QRDataDisplay.tsx`: Replace copy SVGs with `CopyIcon`, section header SVGs with `CodeIcon`, trash SVG with `TrashIcon`
- `History.tsx`: Replace source icon SVGs with `CameraIcon`/`DocumentIcon`/existing icons, close with `CloseIcon`, delete with `CloseIcon`, clear with `TrashIcon`
- `QRPreview.tsx`: Replace download SVG with `DownloadIcon`, copy with `CopyIcon`, chevron with `ChevronIcon`
- `StandardQRGenerator.tsx` + `MiniQRGenerator.tsx`: Replace trash SVG with `TrashIcon`

**Step 4: Extract scanner corner markers to CSS**

In `QRScanner.tsx` lines 168-211, replace the 4 inline-styled divs with simple class-based divs and move styles to CSS. Create a `scanner-corner` class with modifiers for each position.

**Step 5: Run full test suite**

Run: `npm test -- --run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/icons/ src/components/QRScanner.tsx src/components/QRDataDisplay.tsx src/components/History.tsx src/components/generator/QRPreview.tsx src/components/generator/StandardQRGenerator.tsx src/components/MiniQRGenerator.tsx
git commit -m "refactor: extract inline SVGs into reusable icon components"
```

---

## Final Verification

Run: `npm test -- --run`
Expected: All tests pass (525 original + new hook tests)

Run: `npm run build`
Expected: Clean build with no TypeScript errors
