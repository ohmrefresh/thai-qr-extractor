# Component Structure Refactoring Design

**Date:** 2026-02-07
**Status:** Approved
**Goals:** Fix failing tests, improve code organization, reduce technical debt

---

## Problem Statement

### Test Failures
- 19 tests failing with timeouts (~1015-1047ms)
- Root cause: Lazy-loaded Suspense components don't resolve in test environment
- Tests wait for elements inside lazy components that never render

### Code Organization Issues
- **QRGenerator**: 922 lines (single monolithic component)
- **QRScanner**: 359 lines (complex camera management mixed with UI)
- **MiniQRGenerator**: 351 lines (duplicates patterns from QRGenerator)
- **App.tsx**: 193 lines (inline SVG icons, could be cleaner)
- Duplication of form patterns, preview logic, validation across generators

### Technical Debt
- Large components hard to maintain and test
- Mixed concerns (logic, UI, state management)
- No reusable form components
- Inline SVG clutter

---

## Solution Overview

**Two-phase approach:**
1. **Phase 1:** Fix all 19 failing tests using global lazy component mocking
2. **Phase 2:** Refactor component structure focusing on decomposition and reusability

---

## Phase 1: Test Fixes - Global Lazy Component Mocking

### Problem
Lazy-loaded components wrapped in Suspense don't resolve in tests, causing `findByText` queries to timeout at 1000ms.

### Solution
Mock lazy imports globally in `setupTests.ts` to replace them with direct imports in test environment only.

### Implementation

Add to `setupTests.ts`:

```typescript
// Mock lazy-loaded components to resolve synchronously in tests
vi.mock('./components/ScanMethodsTabs', async () => {
  const actual = await vi.importActual('./components/ScanMethodsTabs');
  return actual;
});

vi.mock('./components/QRDataDisplay', async () => {
  const actual = await vi.importActual('./components/QRDataDisplay');
  return actual;
});

vi.mock('./components/QRGenerator', async () => {
  const actual = await vi.importActual('./components/QRGenerator');
  return actual;
});

vi.mock('./components/History', async () => {
  const actual = await vi.importActual('./components/History');
  return actual;
});

// Mock nested lazy components in ScanMethodsTabs
vi.mock('./components/QRScanner', async () => {
  const actual = await vi.importActual('./components/QRScanner');
  return actual;
});

vi.mock('./components/FileUpload', async () => {
  const actual = await vi.importActual('./components/FileUpload');
  return actual;
});

vi.mock('./components/TextInput', async () => {
  const actual = await vi.importActual('./components/TextInput');
  return actual;
});
```

### Expected Outcome
- All 19 failing tests pass without modifying test logic or component code
- Production code keeps lazy loading for optimal bundle splitting
- Tests run faster (no async Suspense resolution)

---

## Phase 2: Component Structure Refactoring

### Directory Structure

```
src/
├── components/
│   ├── shared/              # NEW - Reusable UI components
│   │   ├── FormField.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingSpinner.tsx
│   ├── icons/               # NEW - Extracted SVG icons
│   │   ├── QRCodeIcon.tsx
│   │   ├── ScanIcon.tsx
│   │   ├── GenerateIcon.tsx
│   │   └── HistoryIcon.tsx
│   ├── generator/           # NEW - QR generator pieces
│   │   ├── QRGenerator.tsx           (~150 lines - container)
│   │   ├── StandardQRGenerator.tsx   (~250 lines)
│   │   ├── MiniQRGenerator.tsx       (existing, ~351 lines)
│   │   ├── QRPreview.tsx
│   │   ├── PaymentTypeSelector.tsx
│   │   ├── CreditTransferFields.tsx
│   │   ├── BillPaymentFields.tsx
│   │   └── CommonFields.tsx
│   ├── AppHeader.tsx        # NEW - Extracted from App
│   ├── QRScanner.tsx        (~200 lines - simplified)
│   ├── QRDataDisplay.tsx    (unchanged)
│   ├── History.tsx          (unchanged)
│   ├── ScanMethodsTabs.tsx  (unchanged)
│   ├── FileUpload.tsx       (unchanged)
│   └── TextInput.tsx        (unchanged)
├── hooks/
│   ├── useCamera.ts         # NEW - Extracted from QRScanner
│   ├── useQRData.ts         (existing)
│   ├── useHistory.ts        (existing)
│   └── useClipboard.ts      (existing)
└── App.tsx                  (~120 lines - simplified)
```

---

## Component Decomposition Details

### 1. QRGenerator (922 → ~150 lines)

**Current Problems:**
- Handles THREE QR types: Bill Payment, Credit Transfer, Mini QR
- 8+ state variables, multiple debounced effects
- ~350 lines of logic + ~566 lines of JSX
- Difficult to test, maintain, or extend

**New Structure:**

#### QRGenerator.tsx (Container - ~150 lines)
- Payment type tabs (Standard vs Mini QR)
- State coordination
- Delegates to specialized generators
- Minimal logic, mostly composition

#### StandardQRGenerator.tsx (~250 lines)
- Handles both Bill Payment and Credit Transfer
- Uses shared form components
- Preview logic and validation
- Generate/export functionality

#### MiniQRGenerator.tsx (Existing - ~351 lines)
- Keep as-is, integrate into parent QRGenerator
- Already separate, just needs to be child component

#### Shared Form Components:
- **FormField.tsx** - Reusable input wrapper with label/error display
- **QRPreview.tsx** - Preview display logic (used by both Standard and Mini)
- **PaymentTypeSelector.tsx** - Radio group for payment types
- **SampleDataButton.tsx** - "Load Sample" functionality

#### Form Section Components:
- **CreditTransferFields.tsx** - Recipient type, ID, OTA fields
- **BillPaymentFields.tsx** - Biller ID, reference fields
- **CommonFields.tsx** - Amount, merchant name, city (shared across types)

---

### 2. QRScanner (359 → ~200 lines)

**Current Problems:**
- Camera management mixed with UI
- Multiple useEffects for lifecycle
- Complex state management

**New Structure:**

#### QRScanner.tsx (~200 lines)
- Main UI and scanning orchestration
- Uses custom hook for camera logic
- Cleaner component, easier to test

#### hooks/useCamera.ts (NEW)
- Camera enumeration, selection, permissions
- Device lifecycle management
- Returns camera state and control functions
- Reusable in other camera-based features

---

### 3. App.tsx (193 → ~120 lines)

**Current Problems:**
- Inline SVG icons (~40 lines of clutter)
- Header logic mixed with main app logic

**New Structure:**

#### App.tsx (~120 lines)
- Uses extracted icon components
- Uses AppHeader component
- Cleaner main component logic

#### AppHeader.tsx (NEW - ~80 lines)
- Brand logo and title
- Navigation tabs (Scan/Generate)
- History button with badge
- Self-contained header logic

#### Icons (NEW)
- Extract all SVG icons to `components/icons/`
- Each icon is a small component
- Reusable across the app

---

### 4. Shared Components (NEW)

Create `components/shared/` directory with reusable UI building blocks:

- **FormField.tsx** - Consistent input styling with label, error display, help text
- **Card.tsx** - Reusable card wrapper (used across multiple components)
- **ErrorMessage.tsx** - Standardized error display component
- **LoadingSpinner.tsx** - Replace inline spinner divs with reusable component

---

## Implementation Plan

### Sequential Order (Fix Tests → Refactor)

#### Phase 1: Fix Tests (Priority) ✅
1. Update `setupTests.ts` with lazy component mocks
2. Run tests, verify all 19 failures are fixed
3. Run full test suite to ensure no regressions
4. **Commit:** "Fix test timeouts by mocking lazy components"

#### Phase 2: Extract Shared Components (Foundation)
1. Create `components/shared/` and `components/icons/` directories
2. Build reusable components:
   - FormField.tsx
   - Card.tsx
   - ErrorMessage.tsx
   - LoadingSpinner.tsx
3. Extract all SVG icons to icon components
4. Test each extraction (run existing tests)
5. **Commit:** "Extract shared components and icons"

#### Phase 3: Refactor QRGenerator (Biggest Impact)
1. Create `components/generator/` directory
2. Create form section components:
   - CreditTransferFields.tsx
   - BillPaymentFields.tsx
   - CommonFields.tsx
3. Extract QRPreview component
4. Extract PaymentTypeSelector component
5. Create StandardQRGenerator.tsx
6. Refactor main QRGenerator.tsx as container
7. Move MiniQRGenerator.tsx to generator/ directory
8. Update imports in App.tsx
9. Update tests incrementally (one component at a time)
10. **Commit:** "Decompose QRGenerator into smaller components"

#### Phase 4: Polish Other Components
1. Extract useCamera hook from QRScanner
2. Update QRScanner to use the hook
3. Test QRScanner functionality
4. Create AppHeader component
5. Refactor App.tsx to use AppHeader and icon components
6. Update App tests
7. **Commit:** "Refactor QRScanner and App components"

#### Phase 5: Cleanup & Verification
1. Remove any unused code or imports
2. Run full test suite (expect 289 passing, 0 failing)
3. Check bundle size: `npm run build` (should be similar or better)
4. Manual smoke test of all features
5. **Commit:** "Complete component structure refactoring"

---

## Success Criteria

### Tests
- ✅ All tests pass (289 passing, 0 failing)
- ✅ No test timeouts
- ✅ Test run time improved

### Component Size
- ✅ No component exceeds 350 lines
- ✅ Largest component (StandardQRGenerator) is ~250 lines
- ✅ QRGenerator reduced from 922 → ~150 lines
- ✅ App.tsx reduced from 193 → ~120 lines
- ✅ QRScanner reduced from 359 → ~200 lines

### Code Quality
- ✅ Bundle size maintained or improved
- ✅ No duplication between generator components
- ✅ Clear separation of concerns
- ✅ Reusable components in shared/ directory
- ✅ Extracted hooks follow single responsibility principle
- ✅ All existing functionality preserved

### Developer Experience
- ✅ Easier to find and modify specific features
- ✅ Components are easier to test
- ✅ New features easier to add
- ✅ Consistent patterns across codebase

---

## Risk Mitigation

### Risk: Breaking existing functionality
**Mitigation:**
- Incremental refactoring with commits after each major change
- Run tests after each step
- Manual testing of critical user flows

### Risk: Test updates needed
**Mitigation:**
- Update tests incrementally alongside component changes
- Keep test coverage at or above current levels
- Focus on testing behavior, not implementation details

### Risk: Bundle size increase
**Mitigation:**
- Check bundle size after refactor
- Maintain lazy loading where beneficial
- Use tree-shaking friendly exports

### Risk: Merge conflicts (if working in feature branch)
**Mitigation:**
- Complete refactor in focused session
- Communicate with team about scope
- Keep main branch up to date during work

---

## Notes

- Production lazy loading is preserved (only mocked in tests)
- All existing functionality must work exactly as before
- Focus on structural improvements, not feature changes
- Maintain existing test coverage (currently 270 passing tests)
- TypeScript types should be preserved and improved where possible
