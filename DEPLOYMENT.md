# Deployment Guide

This project is set up to deploy to GitHub Pages using two methods:

## 🤖 Automatic Deployment (GitHub Actions)

The project automatically deploys to GitHub Pages when code is pushed to the `main` branch.

### How it works:
1. GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to `main`
2. Runs tests to ensure code quality
3. Builds the production app
4. Deploys to GitHub Pages automatically

### Setup Requirements:
1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Ensure Actions have necessary permissions

## 🛠️ Manual Deployment

You can also deploy manually using the provided script:

```bash
# Method 1: Use the deployment script
./deploy-manual.sh

# Method 2: Run commands individually
npm ci
npm test -- --watchAll=false
npm run build
npm run deploy
```

## 🌐 Live Site

Once deployed, the site will be available at:
**https://ohmrefresh.github.io/thai-qr-extractor**

## 📝 Configuration

Key configuration files:
- `package.json` - Contains homepage URL and deploy scripts
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `deploy-manual.sh` - Manual deployment script

## 🔧 Troubleshooting

### Common Issues:

1. **Build fails due to TypeScript errors**
   - Fix TypeScript errors before deploying
   - Run `npm run build` locally to test

2. **GitHub Actions deployment fails**
   - Check Actions tab in GitHub repository
   - Ensure GitHub Pages is enabled with "GitHub Actions" source
   - Verify workflow permissions

3. **Site not loading correctly**
   - Check that `homepage` field in `package.json` matches your repository name
   - Ensure relative paths are used for assets

4. **Tests failing in CI**
   - All tests must pass before deployment
   - Run `npm test` locally to verify

## 🎯 Deployment Status

You can check deployment status:
- **GitHub Actions**: Repository > Actions tab
- **GitHub Pages**: Repository > Settings > Pages
- **Live Site**: Click the deployment URL in the Actions workflow

## 📦 Build Output

The build creates:
- Optimized JavaScript bundles
- Minified CSS
- Static assets
- Service worker for PWA functionality

All files are output to the `build/` directory and deployed to the `gh-pages` branch.