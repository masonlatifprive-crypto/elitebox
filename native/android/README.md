# EliteBox Native Android / Android TV Builds

The native Android projects are generated in CI from the Vite `dist` folder using Capacitor.

Artifacts produced by `.github/workflows/native-android.yml`:

1. `elitebox-android-mobile-debug-apk` - mobile/tablet Android debug APK.
2. `elitebox-android-tv-debug-apk` - Android TV-flavored debug APK with Leanback feature metadata applied during CI.

Production release requirements:

1. A real Android signing keystore.
2. GitHub Actions secrets:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
3. Play Console upload access if publishing to Google Play.

Without signing secrets, CI intentionally builds debug APKs only. These are real installable APK files for testing, but not Play Store release artifacts.
