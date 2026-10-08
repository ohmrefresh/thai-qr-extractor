# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.5...0.2.0
[0.1.5]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/ohmrefresh/thai-qr-extractor/compare/0.1.1...0.1.3
[0.1.1]: https://github.com/ohmrefresh/thai-qr-extractor/releases/tag/0.1.1
