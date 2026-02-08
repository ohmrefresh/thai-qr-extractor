# Component & Utility Refactoring Design

## Goal

Reduce code duplication across components and utilities without changing public APIs or visual behavior.

## Phase 1: Extract Shared QR Utilities (`qrUtils.ts`)

**Problem:** `thaiQRGenerator.ts` and `miniQRGenerator.ts` each have their own CRC16 and TLV functions.

**Solution:** Create `src/utils/qrUtils.ts` with shared `calculateCRC16()` and `formatTLV()`. Both generators import from it.

**Files:** Create `qrUtils.ts`, modify `thaiQRGenerator.ts`, `miniQRGenerator.ts`

## Phase 2: Extract Generator Hooks

**Problem:** `StandardQRGenerator` and `MiniQRGenerator` duplicate ~60 lines of debounce/preview and state management logic.

**Solution:**
- `useDebouncedPreview` hook — debounce timer, preview state, generating state
- `useQRGeneratorState` hook — result/errors/isGenerating state, generate/clear patterns, derived `qrResult`/`isPreview`

**Files:** Create `src/hooks/useDebouncedPreview.ts`, `src/hooks/useQRGeneratorState.ts`, modify `StandardQRGenerator.tsx`, `MiniQRGenerator.tsx`

## Phase 3: QRPreview Clipboard Fix

**Problem:** `QRPreview.tsx` has inline clipboard logic while `useClipboard` hook exists.

**Solution:** Replace with `useClipboard` hook import.

**Files:** Modify `QRPreview.tsx`

## Phase 4: Icon Extraction & Scanner Overlay

**Problem:** Inline SVGs duplicated across 6+ components.

**Solution:**
- Add icons: `CopyIcon`, `TrashIcon`, `RefreshIcon`, `CloseIcon`, `DownloadIcon`, `ChevronIcon`, `CodeIcon`, `ErrorIcon`, `StopIcon`
- Replace inline SVGs in all components
- Extract scanner corner markers to CSS classes or a `ScannerOverlay` component

**Files:** Add ~9 icons to `src/components/icons/`, modify `QRScanner.tsx`, `QRDataDisplay.tsx`, `History.tsx`, `QRPreview.tsx`, `StandardQRGenerator.tsx`, `MiniQRGenerator.tsx`

## Verification

Run full test suite after each phase.
