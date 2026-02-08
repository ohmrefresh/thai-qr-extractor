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
