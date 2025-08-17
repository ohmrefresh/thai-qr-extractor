# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript application for extracting and parsing Thai QR code payment data. The app allows users to scan QR codes via camera or upload image files to decode Thai payment QR codes (PromptPay format).

## Development Commands

- `npm start` - Start development server on localhost:3000
- `npm test` - Run test suite in interactive watch mode
- `npm run build` - Build production bundle
- `npm install` - Install dependencies

## Architecture

### Core Components

**App.tsx** - Main application component that manages state for QR data and error handling. Coordinates between scanning/upload components and data display.

**QRScanner.tsx** - Camera-based QR code scanning using html5-qrcode library. Handles camera permissions and real-time scanning.

**FileUpload.tsx** - File upload component for scanning QR codes from images using jsQR library. Processes images through canvas for QR detection.

**TextInput.tsx** - Manual text input component for pasting raw QR code data directly. Supports keyboard shortcuts (Ctrl+Enter/Cmd+Enter) for quick parsing and includes validation.

**QRDataDisplay.tsx** - Displays parsed QR code data in formatted sections including summary, raw data, and detailed field breakdown. Features expandable sub-tag display for fields containing nested data structures.

### Core Utilities

**thaiQRParser.ts** - Contains the main QR parsing logic. Implements EMV QR Code specification for Thai payment codes:
- Parses tag-length-value (TLV) format with nested sub-tag support
- Extracts PromptPay merchant IDs
- Maps field tags and sub-tags to human-readable descriptions
- Returns structured ThaiQRData interface with hierarchical field/sub-tag data
- Supports sub-tag extraction for merchant account information (tags 15, 29), additional data fields (tag 62), and other template tags

### Key Libraries

- `html5-qrcode` - Camera-based QR scanning
- `jsqr` - Image-based QR decoding
- `qr-scanner` - Additional QR scanning capability

## Data Flow

1. User initiates scan (camera), upload (file), or text input (paste)
2. QR data extracted using respective library (html5-qrcode, jsQR, or direct text)
3. Raw QR string passed to `parseThaiQR()` function in thaiQRParser.ts
4. Parser extracts TLV (Tag-Length-Value) fields and maps to ThaiQRData structure with nested sub-tag support
5. Parsed data displayed in formatted view with expandable sections and clear/reset option

## Testing

Uses React Testing Library with Jest. Test files follow `.test.tsx` pattern.

- `npm test` - Run all tests in watch mode
- Core parser logic tested in `thaiQRParser.test.ts`