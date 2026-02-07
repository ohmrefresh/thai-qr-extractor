# Thai QR Code Tools

[![CI - Test & Coverage](https://github.com/ohmrefresh/thai-qr-extractor/actions/workflows/ci.yml/badge.svg)](https://github.com/ohmrefresh/thai-qr-extractor/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/ohmrefresh/thai-qr-extractor/actions/workflows/deploy.yml/badge.svg)](https://github.com/ohmrefresh/thai-qr-extractor/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/ohmrefresh/thai-qr-extractor/branch/main/graph/badge.svg)](https://codecov.io/gh/ohmrefresh/thai-qr-extractor)
[![Coverage](https://img.shields.io/badge/coverage-84.77%25-brightgreen)](https://github.com/ohmrefresh/thai-qr-extractor)

A React TypeScript application for extracting and parsing Thai QR code payment data. The app allows users to scan QR codes via camera, upload image files, or manually input QR data to decode Thai payment QR codes (PromptPay format).

🌐 **Live Demo**: [https://ohmrefresh.github.io/thai-qr-extractor](https://ohmrefresh.github.io/thai-qr-extractor)

## Features

- 📱 **Camera QR Scanning** - Real-time QR code scanning using device camera
- 🖼️ **Image Upload** - Upload and scan QR codes from image files
- ⌨️ **Text Input** - Manually paste or type QR code data
- 🔍 **Thai QR Parser** - Parse PromptPay and EMV QR code formats
- 🏗️ **QR Generator** - Generate Thai payment QR codes
- 📊 **Data Display** - Formatted display of parsed QR data with expandable sections
- 📝 **History** - Track previous scans and generations
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **React 19** with TypeScript
- **html5-qrcode** for camera scanning
- **jsQR** for image-based QR decoding
- **qrcode** for QR generation
- **React Testing Library** for testing
- **GitHub Actions** for CI/CD

## Code Quality

- ✅ **Test Coverage**: 84.77%
- ✅ **270 Unit Tests** passing across 11 test files
- ✅ **TypeScript** for type safety
- ✅ **Custom Hooks** for clean architecture
- ✅ **Component-based Design** with feature-focused organization
- ✅ **Comprehensive Testing** with React Testing Library and Vitest

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run deploy`

Builds and deploys the app to GitHub Pages.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## 🚀 Deployment

This project is configured for automatic deployment to GitHub Pages:

### Automatic Deployment
- Pushes to `main` branch trigger automatic deployment via GitHub Actions
- Tests must pass before deployment
- Built app is deployed to `gh-pages` branch

### Manual Deployment
```bash
# Run the deployment script
./deploy-manual.sh

# Or run commands individually  
npm run build
npm run deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📖 Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Run tests: `npm test`
5. Build for production: `npm run build`

## 🧪 Testing

The project includes comprehensive tests:
- Unit tests for utilities and components
- Integration tests for QR parsing and generation
- Test coverage reporting

Run tests with: `npm test`

## 📝 Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed project architecture and development guidelines.

## 🔗 Links

- **Live Demo**: [https://ohmrefresh.github.io/thai-qr-extractor](https://ohmrefresh.github.io/thai-qr-extractor)
- **Repository**: [https://github.com/ohmrefresh/thai-qr-extractor](https://github.com/ohmrefresh/thai-qr-extractor)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
