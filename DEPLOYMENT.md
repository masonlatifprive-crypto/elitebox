# EliteBoxMovies Recovery & Deployment Guide

## Status: Recovered (August 2026)

### Key Fixes Applied:
1. **Routing Fix (App.tsx):** Restored HashRouter for better compatibility with static hosting and added proper layout wrapping.
2. **Detail Page (Detail.tsx):** Fixed metadata rendering and playback initialization logic.
3. **Deployment Workflows:** 
   - `.github/workflows/deploy-ftp.yml`: New workflow for automated Cloud86 deployment via FTP.
   - `.github/workflows/native-twa.yml`: Updated for Android/Windows debug builds.

## Deployment Process (Web)
To deploy to Cloud86/Plesk:
1. Ensure GitHub Secrets `FTP_SERVER`, `FTP_USERNAME`, and `FTP_PASSWORD` are set.
2. Trigger the "Deploy to Cloud86 FTP" workflow.
3. Files are uploaded to `httpdocs/`.

## Native Builds
- **Android APK/TWA:** Triggered via Native TWA workflow.
- **Windows EXE:** Triggered via native debug workflows.
