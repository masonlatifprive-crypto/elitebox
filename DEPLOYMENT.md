# EliteBoxMovies Deployment Guide



## Overview

This is a Vite-based React 19 application. It is hosted on **Cloud86** using **Plesk** with a **LiteSpeed** web server.



## Project Structure

- **Frontend**: React (Vite)

- **Native Support**: Capacitor (Android), Electron (Windows/Desktop)

- **API**: PHP-based backend (see `public/api/cine.php`)



## Deployment Reality

### Web Deployment (Cloud86/Plesk)

- **Hosting Environment**: Cloud86 Shared/Pro Hosting.

- **Web Server**: LiteSpeed.

- **CI/CD**: GitHub Actions builds the project and uploads artifacts.

- **Manual Upload**: Build files (contents of `dist/` folder) must be uploaded to the server's web root (typically `httpdocs/` or `public_html/`).

- **SPA Fallback**: Ensure `.htaccess` (located in `public/`) is present in the production root to handle React Router client-side routing.

- **Port Note**: Standard Plesk port 8443 may be blocked; use port 443 (File Manager) or standard FTP/SFTP.



### GitHub Secrets for Deployment

Required secrets for automated deployment (if configured):

- `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`

- `SFTP_SERVER`, `SFTP_USERNAME`, `SFTP_PASSWORD`, `SFTP_PORT`

- `PLESK_HOST`, `PLESK_USERNAME`, `PLESK_PASSWORD`, `PLESK_API_TOKEN`



### Native Builds

- **Android**: Triggered via GitHub Actions. Requires `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, etc., for release builds.

- **Windows**: Uses Electron Builder.



## Maintenance

- **Build Command**: `npm run build`

- **Preview**: `npm run preview`

