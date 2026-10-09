# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-10-09

CI and deployment workflows updated to the latest GitHub Actions releases. No app changes.

### Changed
- `actions/checkout`, `actions/setup-node` and `actions/upload-artifact` to v7; `actions/configure-pages` to v6; `actions/upload-pages-artifact` and `actions/deploy-pages` to v5; `marocchino/sticky-pull-request-comment` to v3; `codecov/codecov-action` to v7.
- Test results upload to Codecov through `codecov/codecov-action` (`report_type: test_results`) instead of the deprecated `codecov/test-results-action`.
- Dependabot now checks GitHub Actions weekly.

### Removed
- `irongut/CodeCoverageSummary` step from CI; its output was unused. The coverage PR comment and job summary are unchanged.

## [0.3.0] - 2026-10-09

Decoded payloads are now checked for validity, the raw payload can be inspected and edited in place, and the interface was redesigned as a quiet, accessible instrument.

### Added
- **Validity verdict for decoded payloads.** The CRC (Tag 63, or Tag 91 for Mini QR) is recomputed and the decoded view reports CRC mismatches, a missing or misplaced CRC, unparsed bytes (with their offset), a wrong Payload Format Indicator, malformed Tag 29/30/62 templates and missing mandatory sub-tags (including OTA for AID `A000000677010114`). Problem rows are flagged in the table.
- **Raw payload inspector.** The raw string is split into tag, length and value segments that link to their table rows, with unreadable bytes marked. Copy and Edit actions; Edit re-decodes in place with ⌘/Ctrl+Enter.
- "Inspect in decoder" action in the generator preview.
- Undo for History "Clear all".
- Generator remembers the last payment type; the scan view remembers the last method and defaults to Paste with a mouse or Camera on touch devices.
- `PRODUCT.md` describing users, purpose and design principles.

### Changed
- Redesigned UI: slate neutrals with one blue accent reserved for state and action; gradients, glow shadows, glassmorphism, decorative motion and icon tiles removed; one surface per view; parsed fields shown as a real table.
- System font stacks and a fixed six-step type scale; sentence-case labels.
- Generating a QR stays on the form and saves it to History instead of jumping to the decoder. The generator keeps its state when switching views, and the QR string is shown expanded.
- The Value column shows raw values (Tag 53 `764`); friendly names move to the Description column. The amount shows `฿` only for THB.
- Pasted text is kept after decoding. "Clear" is now "New payload".
- Rewritten error, empty-state and help copy, including precise parse errors.
- Responsive layout: compact field rows on phones, 44px touch targets, no horizontal scroll at 320px or 200% text, safe-area insets.
- Decode verdict toasts replace each other instead of stacking; toasts moved to the bottom right.

### Fixed
- Tag 29 and Tag 30 sub-tag labels now follow the PromptPay spec (for example Tag 29/01 is "Mobile Number", Tag 30/01–03 are Biller ID, Reference 1 and Reference 2). Recipient, biller ID and reference are extracted correctly, so History titles are no longer "QR Code (01)".
- Malformed, truncated or tampered payloads no longer report success.
- Error messages no longer repeat "Error: Error:".
- The camera stream is released if the scanner unmounts while the camera is starting.
- Accessibility: WCAG AA contrast tokens and visible focus rings; the History drawer is a modal dialog with focus management and Escape to close; labelled paste textarea, History button and icon buttons; table semantics for parsed fields; announced errors; field-level generator errors with `aria-invalid`; correct heading order; `prefers-reduced-motion` support.

### Performance
- The camera library (~108 kB gzipped) loads only when the camera is started; first-load JavaScript on phones drops from 195.6 kB to 91.3 kB.
- Uploaded images are decoded at a 1600 px long edge first, falling back to full resolution only when no QR is found.
- `App.css` deduplicated from about 8,600 to 4,700 lines with no change to computed styles; shipped CSS drops from 13.8 kB to 10.2 kB gzipped.
- Removed the artificial 150 ms delay before parsing pasted text; transitions limited to paint and compositor properties.

## [0.2.0] - 2026-10-08

Toolchain upgrade to the latest major versions. No user-facing behavior change.

### Changed
- **Node 24 is now required.** Pinned in `.nvmrc`; CI and deploy workflows read it via `node-version-file`. `package.json` declares `engines.node >=24`.
- Package is now ESM (`"type": "module"`), as expected by Vite 8's native config loader.
- Upgraded build tooling: Vite 7 → 8 (Rolldown/Oxc), `@vitejs/plugin-react` 5 → 6, TypeScript 5.9 → 7.0.
- Upgraded test tooling: Vitest 4 → 5, jsdom 27 → 30, `@testing-library/jest-dom` 6 → 7, Testing Library minor updates.
- Upgraded React and React DOM to 19.3, sonner to 2.0.8, `@types/node` to 24 (matches the runtime).
- Vendor chunks are now defined with Rolldown `build.rolldownOptions.output.codeSplitting.groups`; chunk names are unchanged. Two tiny icon chunks are now inlined and Rolldown adds a small runtime chunk.
- `jest-dom` and `@types/*` packages moved to `devDependencies`.
- CI and deploy run plain `npm ci` (no more `--legacy-peer-deps`).

### Removed
- Unused dependencies: `nth-check`, `yaml`, `webpack-dev-server`, `baseline-browser-mapping`, `postcss`, `web-vitals`.
- `@codecov/vite-plugin`: its peer range excluded Vite 7+, and bundle analysis never ran in CI. Coverage upload via `codecov-action` is unchanged.
- No-op `reportWebVitals` (it was called without a handler).
- Invalid `build.esbuild` block in `vite.config.ts` (not a Vite option; it never stripped `console`/`debugger`).
- CRA leftover `src/react-app-env.d.ts`, replaced by `src/vite-env.d.ts` referencing `vite/client`.

### Fixed
- `deploy-manual.sh` passed the Jest-only `--watchAll=false` flag, which Vitest rejects; it now uses `--run`.

## [0.1.5] - 2026-02-08

### Changed
- Extracted shared CRC16 and TLV utilities into `qrUtils.ts`.
- Extracted `useDebouncedPreview` and `useQRGeneratorState` hooks; `QRPreview` now uses `useClipboard`.
- Extracted inline SVGs into reusable icon components.
- Enhanced CI/CD workflows; Codecov upload made non-fatal with telemetry disabled.
- Updated site title and README.

### Fixed
- Stabilized timers in `FileUpload` tests.

## [0.1.4] - 2026-02-08

### Added
- Mini QR generator with debounced live preview and parsing support.
- QR export from the live preview, with field validation.
- Toast notifications and a history drawer.
- History panel search/filter and renaming of history items.
- App header, scan-method tabs, and drag-and-drop file upload.
- Fintech Blue theme and refreshed component styles.
- `SECURITY.md` security policy.

### Changed
- Redesigned QR scanner, file upload, text input, QR preview and QR data views.
- Selecting a history item switches to the scan view.
- Optional info fields are shown only for bill payment.
- Mobile recipient IDs are normalized and their formatting clarified.
- Default MCC is no longer added to generated QR codes.

### Fixed
- Mini QR checksum (CRC) handling.

## [0.1.3] - 2025-12-13

### Added
- Dual payment type support in the QR generator (Tag 29 credit transfer, Tag 30 bill payment).
- Live QR code preview in the generator.
- Currency mapping utility and richer QR data display.
- Comprehensive unit and component tests; CI and coverage workflows.

### Changed
- Migrated from Create React App to Vite and reorganized test files.
- Bundle optimized with code splitting and lazy loading.
- QR logic refactored into custom hooks.
- Redesigned UI styles and updated favicon assets.

## [0.1.1] - 2025-08-17

### Added
- Initial release: Thai QR (PromptPay) parsing via camera scan, image upload and text input.
- PromptPay QR generator (credit transfer).
- Scan history stored in localStorage.
- GitHub Pages deployment.

[0.3.1]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.5...0.2.0
[0.1.5]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.1...0.1.3
[0.1.1]: https://github.com/ohmrefresh/thai-qr-extractor/releases/tag/0.1.1
