# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React TypeScript application for extracting, parsing, and generating Thai QR code payment data (PromptPay format). Supports camera scanning, image upload, text input, and QR code generation following the EMV QR Code specification.

## Development Commands

**Starting development:**
- `npm start` - Start Vite dev server on localhost:5173
- `npm run dev` - Alias for start

**Testing:**
- `npm test` - Run Vitest in watch mode
- `npm test -- --run` - Run tests once without watch
- `npm test -- --run <path>` - Run specific test file
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run coverage` - Generate test coverage report

**Building:**
- `npm run build` - TypeScript compilation + Vite production build
- `npm run preview` - Preview production build locally

**Deployment:**
- `npm run deploy` - Deploy to GitHub Pages (requires build first)

## Architecture

### Dual Functionality: Parser + Generator

The app has **two main modes** accessible via view toggle:

1. **Scan Mode** - Parse/decode existing QR codes
2. **Generate Mode** - Create new Thai payment QR codes

### Component Organization

**Component structure follows feature-based organization:**
- `components/` - Main feature components
- `components/generator/` - QR generation form components
- `components/shared/` - Reusable UI components (FormField, Card, ErrorMessage, LoadingSpinner)
- `components/icons/` - SVG icon components
- `hooks/` - Custom React hooks

### Core Components

**App.tsx** - Root component managing view state (scan/generate), QR data state, error handling, and history. Uses AppHeader for navigation and coordinates between input/display components.

**AppHeader.tsx** - Application header with brand logo, navigation tabs (Scan/Generate), and history button with badge.

**QRScanner.tsx** - Camera-based scanning using `html5-qrcode`. Uses `useCamera` hook for camera management. Handles QR detection and decoding from camera stream.

**FileUpload.tsx** - Image file upload using `jsQR`. Processes images via canvas API for QR detection.

**TextInput.tsx** - Manual QR string input with validation and keyboard shortcuts (Ctrl/Cmd+Enter to parse).

**QRGenerator.tsx** - Container component (~70 lines) that delegates to specialized generators:
- **StandardQRGenerator.tsx** - Handles Tag 29 (Credit Transfer) and Tag 30 (Bill Payment) with live preview and validation
- **MiniQRGenerator.tsx** - Simplified generator for basic QR codes
- **Payment-specific fields**: CreditTransferFields, BillPaymentFields, CommonFields components
- **PaymentTypeSelector.tsx** - Tab-based payment type selection UI
- **QRPreview.tsx** - Live QR code preview with export options (PNG download, string copy)

**QRDataDisplay.tsx** - Formatted display of parsed QR data with expandable sections for summary, raw data, and field-by-field breakdown including nested sub-tags.

**History.tsx** - Persistent history of scanned/generated QR codes using localStorage.

### Core Utilities

**thaiQRParser.ts** - EMV QR Code parser implementing TLV (Tag-Length-Value) format:
- Parses hierarchical structure with nested sub-tags
- Maps tags to human-readable descriptions
- Extracts PromptPay-specific data (merchant IDs, references)
- Supports Tags 15, 29, 30, 62 with sub-tag extraction
- Returns `ThaiQRData` interface with `parsedFields` array containing `QRField` objects (each with optional `subTags: QRSubTag[]`)

**thaiQRGenerator.ts** - QR code generation following PromptPay specification:
- Supports two `PaymentType` modes: `'credit-transfer'` (Tag 29) or `'bill-payment'` (Tag 30)
- **Tag 29 sub-tags**: AID (00), Recipient ID (01-04 based on type), OTA (05)
- **Tag 30 sub-tags**: AID (00), Biller ID (01), Reference 1 (02), Reference 2 (03)
- References go to Tag 62 for credit transfer, but stay in Tag 30 for bill payment
- CRC16-CCITT checksum calculation (Tag 63)
- Validation with conditional requirements (e.g., OTA mandatory when AID = A000000677010114)

**currencyMapper.ts** - Maps ISO 4217 currency codes to symbols and names.

**historyStorage.ts** - LocalStorage wrapper for QR history with 50-item limit and date tracking.

### Custom Hooks

**useCamera.ts** - Manages camera lifecycle, enumeration, permissions, and device selection. Extracted from QRScanner for reusability.

**useQRData.ts** - Manages QR data state and parsing logic.

**useHistory.ts** - Manages history state and localStorage persistence.

**useClipboard.ts** - Handles clipboard operations for copying QR strings.

### Key Data Structures

```typescript
// Parser output
interface ThaiQRData {
  version: string;
  parsedFields: QRField[];
  merchantId?: string;
  amount?: number;
  // ... other extracted fields
}

interface QRField {
  tag: string;
  length: number;
  value: string;
  description: string;
  subTags?: QRSubTag[];  // Nested structure
}

interface QRSubTag {
  tag: string;  // Note: property is 'tag', not 'id'
  length: number;
  value: string;
  description: string;
}

// Generator input
interface ThaiQRGeneratorInput {
  paymentType: 'credit-transfer' | 'bill-payment';
  aid: string;

  // Tag 29 fields
  recipientType?: 'mobile' | 'national-id' | 'ewallet' | 'bank-account';
  recipientId?: string;
  ota?: string;

  // Tag 30 fields
  billerId?: string;
  reference1?: string;
  reference2?: string;

  // Common
  amount?: number;
  merchantName?: string;
  merchantCity?: string;
}
```

## PromptPay QR Specification

### Tag 29 - Credit Transfer
- **Purpose**: PromptPay credit transfers
- **AID values**:
  - `A000000677010111` - Merchant-presented QR
  - `A000000677010114` - Customer-presented QR
- **Sub-tags**:
  - 00: AID (mandatory)
  - 01: Mobile Number (13 digits, e.g., 0066XXXXXXXXX)
  - 02: National ID / Tax ID (13 digits)
  - 03: E-Wallet ID (15 digits)
  - 04: Bank Account (up to 43 chars)
  - 05: OTA (10 digits, mandatory if AID = A000000677010114)

### Tag 30 - Bill Payment
- **Purpose**: Bill payment transactions
- **AID values**:
  - `A000000677010112` - Domestic merchant
  - `A000000677012006` - Cross-border merchant
- **Sub-tags**:
  - 00: AID (mandatory)
  - 01: Biller ID (15 digits, National ID/Tax ID + suffix)
  - 02: Reference 1 (mandatory, up to 20 chars)
  - 03: Reference 2 (optional, up to 20 chars)

## Testing Strategy

Uses **Vitest** with React Testing Library (migrated from Jest).

**Test organization:**
- `src/utils/__tests__/` - Unit tests for utilities
- `src/components/__tests__/` - Component integration tests
- `src/__tests__/` - App-level tests

**Key test files:**
- `thaiQRParser.test.ts` - Parser logic, TLV parsing, sub-tag extraction
- `thaiQRGenerator.test.ts` - Generator logic, Tag 29/30 validation, sub-tag placement
- `QRGenerator.test.tsx` - UI behavior, payment type switching, form validation
- `QRDataDisplay.test.tsx` - Data display, sub-tag expansion

**Test patterns:**
- Mock QR code image generation via `qrcode` module
- Use `parseThaiQR()` to verify round-trip generation → parsing
- Verify sub-tag placement: check `field.subTags?.find(st => st.tag === 'XX')`
- Component tests use `fireEvent` and `waitFor` from RTL
- Lazy-loaded components mocked in setupTests.ts for synchronous resolution

**Current test count:** 270 tests across 11 test files

## Build System

- **Vite** for dev server and production builds
- **TypeScript** compilation checked before Vite build
- Production build outputs to `build/` directory
- Code splitting and lazy loading for components
- GitHub Pages deployment via `gh-pages` package

## Data Flow

**Scan Mode:**
1. User scans/uploads/inputs QR code
2. Raw string → `parseThaiQR()` in thaiQRParser.ts
3. TLV parsing with recursive sub-tag extraction
4. Structured data → QRDataDisplay with expandable sections
5. Add to history via historyStorage

**Generate Mode:**
1. User selects payment type (Tag 29 or Tag 30)
2. Form validates based on payment type (different required fields)
3. Input → `generateThaiQR()` in thaiQRGenerator.ts
4. TLV encoding with correct sub-tag placement
5. CRC calculation → QR code image generation
6. Display with download/copy options + add to history

## Important Implementation Notes

- **Sub-tag property name**: In parsed data, sub-tags use `st.tag`, NOT `st.id`
- **Reference placement**: Tag 62 for credit transfer, Tag 30 for bill payment
- **Conditional validation**: OTA required only when AID = A000000677010114
- **History limit**: Maximum 50 items stored in localStorage
- **Live preview**: QRGenerator debounces preview generation (500ms delay)
- **Component architecture**: QRGenerator is a container (~70 lines) that delegates to StandardQRGenerator, MiniQRGenerator, and shared form components
- **Test mocking**: Lazy-loaded components are mocked in setupTests.ts to resolve synchronously in test environment
- **Icon components**: All SVG icons extracted to `components/icons/` for reusability
