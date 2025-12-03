# ASINU Lite – Progress Report (Nov 2025)

## Runtime & Build
- Dev client Android built via EAS (profile `development`, new architecture enabled, local keystore in `credentials/asinu-lite-dev.keystore`, credentials config in `credentials.json`).
- expo-router redirect crash fixed by deferring navigation until root navigation is ready (see `app/index.tsx` and `RUNTIME_FIXLOG.md`).
- React Native new-arch enabled in `app.json`; babel includes `react-native-reanimated/plugin`.

## Current Dev Environment (to reopen dev client)
- Install deps: `npm install` (requires `babel-preset-expo` present in devDeps).
- Start Metro for dev client (PowerShell):
  ```pwsh
  cd F:\asinu\apps\asinu-lite
  $env:EXPO_PUBLIC_DEV_BYPASS_AUTH="1"   # bypass backend; set API base instead if using real backend
  # or: $env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:3000" for emulator-hosted API
  npx expo start --dev-client --clear
  ```
  - If LAN blocked, add `--tunnel`.
  - Emulator uses bundler via `http://10.0.2.2:8081`; device via LAN IP shown in Metro.
- Keystore (local only): path `credentials/asinu-lite-dev.keystore`, alias `asinuliteDev`, password `asinulite-dev-keypass`. Ignored via `.gitignore`.

## UI Scope (today)
- No logic or navigation changes; only safe UI tweaks.
- Keep routes/components and auth/logs store shapes unchanged.

## Pending / Notes
- Network errors on login are expected if backend unreachable; use `EXPO_PUBLIC_DEV_BYPASS_AUTH=1` to bypass.
- Logs API endpoints expected at `/api/mobile/logs/*`; fallback sample logs shown if fetch fails.
