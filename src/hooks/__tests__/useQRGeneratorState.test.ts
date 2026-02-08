import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQRGeneratorState } from '../useQRGeneratorState';

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
    act(() => { result.current.setErrors(['Error 1', 'Error 2']); });
    expect(result.current.errors).toEqual(['Error 1', 'Error 2']);
  });

  it('should clear errors via clearErrors', () => {
    const { result } = renderHook(() => useQRGeneratorState());
    act(() => { result.current.setErrors(['Error 1']); });
    act(() => { result.current.clearErrors(); });
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
    act(() => { result.current.setErrors(['error']); });
    act(() => { result.current.clearResult(); });
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

    act(() => { result.current.setPreviewResult(previewData); });

    expect(result.current.qrResult).toEqual(previewData);
    expect(result.current.isPreview).toBe(true);
  });
});
